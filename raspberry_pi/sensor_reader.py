#!/usr/bin/env python3
"""
StrokeGuard AI — Raspberry Pi Sensor Reader
============================================
Reads:
  • MPU6050  → Accelerometer (X/Y/Z m/s²) + Gyroscope (X/Y/Z °/s) + Temperature
  • MAX30102  → Heart Rate (BPM) + SpO2 (%)

Posts a JSON payload to the StrokeGuard backend every POLL_INTERVAL seconds.

Setup:
  pip install -r requirements.txt
  # Enable I²C: sudo raspi-config → Interface Options → I2C → Enable

Usage:
  python3 sensor_reader.py
  # Or with a custom backend IP:
  BACKEND_IP=192.168.1.100 python3 sensor_reader.py
"""

import os
import time
import math
import json
import requests
from collections import deque

# ── Configuration ────────────────────────────────────────────────
BACKEND_PORT = os.environ.get("BACKEND_PORT", "5000")

def _find_backend_ip() -> str:
    """
    Resolves the backend IP in this order:
      1. BACKEND_IP environment variable (explicit override)
      2. Auto-detect: try the default gateway (PC on same Wi-Fi)
      3. Fallback: localhost (for testing on the same machine)
    """
    env_ip = os.environ.get("BACKEND_IP", "")
    if env_ip and env_ip != "YOUR_PC_IP_HERE":
        return env_ip
    # Try to detect default gateway as the likely PC IP
    try:
        import subprocess
        result = subprocess.run(
            ["ip", "route", "show", "default"],
            capture_output=True, text=True, timeout=2
        )
        # Output: "default via 192.168.x.x dev wlan0 ..."
        parts = result.stdout.split()
        if len(parts) >= 3 and parts[0] == "default":
            gw = parts[2]
            print(f"   [Auto] Detected gateway {gw} as backend IP. Override with BACKEND_IP env var.")
            return gw
    except Exception:
        pass
    print("   [Warn] Could not detect backend IP. Set BACKEND_IP env var.")
    print("          Example: BACKEND_IP=192.168.1.100 python3 sensor_reader.py")
    return "127.0.0.1"

BACKEND_IP  = _find_backend_ip()
BACKEND_URL = f"http://{BACKEND_IP}:{BACKEND_PORT}/api/sensor-data"
POLL_INTERVAL = 1.0   # seconds between POSTs


# MAX30102 configuration:
# Sensor sample rate is 100Hz. The heart rate algorithm expects a 100-sample buffer
# representing 4.0 seconds of history at 25Hz.
# We accumulate 200 samples at 100Hz (2.0s of raw data) and downsample to 50 samples at 25Hz.
# Smaller buffer = faster first reading; hrcalc works with 50-100 samples fine.
RAW_BUFFER_SIZE = 200

# Thresholds for finger detection
# These are checked against a small ROLLING window of the last 10 raw IR samples,
# NOT the accumulation buffer — so they are independent of buffer fill progress.
# With LED at 3.2mA, a resting IR (no finger) is ~2000-3000, with finger ~20,000-100,000.
FINGER_PRESENT_THRESHOLD = 5000    # IR avg > this → finger is present
FINGER_ABSENT_THRESHOLD  = 3000    # IR avg < this → finger has been removed
SATURATION_THRESHOLD     = 260000  # IR avg > this → ADC saturated (signal clipped, useless)

# Hysteresis state: start as absent
_finger_state = False

# ── Import sensor libraries ──────────────────────────────────────
try:
    from mpu6050 import mpu6050
except ImportError:
    raise SystemExit("❌  mpu6050 library not found. Run: pip install mpu6050-raspberrypi")

try:
    import max30102
    import hrcalc
except ImportError:
    raise SystemExit("❌  max30102 library not found. Run: pip install max30102")

# ── Initialise sensors ───────────────────────────────────────────
print("🔧 Initialising MPU6050 at I²C address 0x68 ...")
mpu = mpu6050(0x68)

print("🔧 Initialising MAX30102 at I²C address 0x57 ...")
m = max30102.MAX30102()
m.setup()   # default: 100 Hz sample rate, 16-bit ADC

# Circular buffers for IR and RED samples at 100Hz (accumulation for hrcalc)
ir_buffer  = deque(maxlen=RAW_BUFFER_SIZE)
red_buffer = deque(maxlen=RAW_BUFFER_SIZE)

# Small rolling window used ONLY for finger detection — always filled, never cleared by main loop
_ir_window = deque(maxlen=10)

# ── Helpers ──────────────────────────────────────────────────────
def compute_movement(accel: dict) -> float:
    """Convert accelerometer magnitude into a 0-100 movement index."""
    magnitude = math.sqrt(accel['x']**2 + accel['y']**2 + accel['z']**2)
    # Subtract gravity (~9.8 m/s²), scale and clamp to 0-100
    return round(max(0.0, min(100.0, abs(magnitude - 9.8) * 12)), 1)


def calc_spo2_robust(ir_data: list, red_data: list) -> tuple[float, bool]:
    """
    Robust SpO2 calculation using the RMS-based AC/DC ratio method.
    Much more reliable than Maxim’s reference algorithm for generic breakout boards.

    Formula: R = (AC_red / DC_red) / (AC_ir / DC_ir)
    SpO2 = 110 - 25 * R  (empirical, valid for calibrated sensors)
    Fallback: SpO2 = 104 - 17 * R  (conservative)
    Valid range: R typically 0.5-1.0 for healthy SpO2 (95-100%)
    """
    import math
    n = len(ir_data)
    if n < 50:
        return -999.0, False

    # DC component (mean)
    dc_ir  = sum(ir_data)  / n
    dc_red = sum(red_data) / n

    if dc_ir < 1 or dc_red < 1:
        return -999.0, False

    # AC component (std deviation ≈ RMS of the pulsatile component)
    ac_ir  = math.sqrt(sum((x - dc_ir)  ** 2 for x in ir_data)  / n)
    ac_red = math.sqrt(sum((x - dc_red) ** 2 for x in red_data) / n)

    if ac_ir < 1:
        return -999.0, False

    # Perfusion index: pulsatile fraction of DC — must be > 0.3% for a valid reading
    pi_ir = ac_ir / dc_ir
    if pi_ir < 0.003:
        return -999.0, False

    # R ratio (dimensionless)
    R = (ac_red / dc_red) / (ac_ir / dc_ir)

    # Empirical linear SpO2 model (from Maxim AN6428 & Reddy 2009)
    spo2 = 110.0 - 25.0 * R

    # Sanity-check physiological range
    if spo2 < 70.0 or spo2 > 100.0:
        return -999.0, False

    return round(spo2, 1), True


def read_max30102() -> tuple[tuple[float, float], str]:
    """
    Drain MAX30102 FIFO into the accumulation buffers.
    Returns ((hr, spo2), reason_string).
    reason_string is used for diagnostic output.
    Downsamples from 100Hz → 25Hz before calling hrcalc.
    Uses a robust AC/DC method as primary SpO2 source.
    """
    global _finger_state

    n = m.get_data_present()
    for _ in range(n):
        red, ir = m.read_fifo()
        _ir_window.append(ir)    # always update the finger-detection window
        if _finger_state:        # only accumulate when finger is confirmed present
            red_buffer.append(red)
            ir_buffer.append(ir)

    # ── Finger detection (hysteresis using _ir_window) ────────────
    if len(_ir_window) == 0:
        return (0.0, 0.0), "No FIFO data yet"

    avg_ir = sum(_ir_window) / len(_ir_window)

    if not _finger_state and avg_ir > FINGER_PRESENT_THRESHOLD:
        _finger_state = True
        print(f"  \U0001f446 Finger detected! Avg IR={avg_ir:.0f}. Accumulating samples...")
    elif _finger_state and avg_ir < FINGER_ABSENT_THRESHOLD:
        _finger_state = False
        ir_buffer.clear()
        red_buffer.clear()
        print(f"  \u270b Finger removed. Avg IR={avg_ir:.0f}. Buffers cleared.")

    # ── Saturation check ──────────────────────────────────────────
    if avg_ir >= SATURATION_THRESHOLD:
        ir_buffer.clear()
        red_buffer.clear()
        return (0.0, 0.0), f"ADC SATURATED (IR={avg_ir:.0f}) — increase LED_PA in max30102.py or reduce current"

    if not _finger_state:
        return (0.0, 0.0), f"No finger (Avg IR={avg_ir:.0f}, need >{FINGER_PRESENT_THRESHOLD})"

    buf_len = len(ir_buffer)
    if buf_len < RAW_BUFFER_SIZE:
        pct = int(buf_len * 100 / RAW_BUFFER_SIZE)
        return (0.0, 0.0), f"Filling buffer {buf_len}/{RAW_BUFFER_SIZE} ({pct}%)  Avg IR={avg_ir:.0f}"

    # Downsample from 100Hz to 25Hz by taking every 4th sample
    ir_list  = list(ir_buffer)
    red_list = list(red_buffer)
    ir_25hz  = [ir_list[i]  for i in range(0, RAW_BUFFER_SIZE, 4)]
    red_25hz = [red_list[i] for i in range(0, RAW_BUFFER_SIZE, 4)]

    # ── Heart Rate via hrcalc (peak detection) ──────────────────────
    hr_val, hr_valid, _, _ = hrcalc.calc_hr_and_spo2(ir_25hz, red_25hz)
    hr = round(float(hr_val), 1) if hr_valid else 0.0

    # ── SpO2 via robust AC/DC ratio method (primary) ────────────────
    spo2_val, spo2_valid = calc_spo2_robust(ir_list, red_list)
    if not spo2_valid:
        # Fallback: try with downsampled 25Hz data
        spo2_val, spo2_valid = calc_spo2_robust(ir_25hz, red_25hz)
    spo2 = round(float(spo2_val), 1) if spo2_valid else 0.0

    reasons = []
    if not hr_valid:   reasons.append(f"HR: too few peaks (IR pulsatile OK={avg_ir:.0f})")
    if not spo2_valid:
        # Compute perfusion index for diagnostics
        import math
        dc_ir = sum(ir_list) / len(ir_list)
        ac_ir = math.sqrt(sum((x - dc_ir) ** 2 for x in ir_list) / len(ir_list))
        pi = (ac_ir / dc_ir * 100) if dc_ir > 0 else 0
        reasons.append(f"SpO2: low pulsatile signal (PI={pi:.2f}%, need >0.3%)")
    reason = "; ".join(reasons) if reasons else f"OK (Avg IR={avg_ir:.0f})"
    return (hr, spo2), reason


# ── Main loop ────────────────────────────────────────────────────
def main():
    print(f"\n✅  StrokeGuard Sensor Reader started")
    print(f"   → Posting to: {BACKEND_URL}")
    print(f"   → Interval:   {POLL_INTERVAL}s")
    print(f"   MAX30102 needs {RAW_BUFFER_SIZE} samples (~{RAW_BUFFER_SIZE//100}s) before HR/SpO2 are valid")
    print("   Place finger firmly and flat on the sensor. Diagnostic output enabled.\n")

    hr, spo2 = 0.0, 0.0   # carry last valid reading between iterations

    while True:
        loop_start = time.time()
        try:
            # ── MPU6050 ──────────────────────────────────────────
            accel = mpu.get_accel_data()   # {'x': float, 'y': float, 'z': float}
            gyro  = mpu.get_gyro_data()    # {'x': float, 'y': float, 'z': float}
            temp  = mpu.get_temp()         # °C (MPU6050 internal die temp)

            movement = compute_movement(accel)

            # ── MAX30102 ─────────────────────────────────────────
            (new_hr, new_spo2), diag = read_max30102()

            if _finger_state:
                # Motion artifact prevention: PPG values are highly unstable during movement.
                # If movement is high (> 15.0), ignore the new readings to prevent false spikes.
                if movement > 15.0:
                    print(f"  ⚠ High movement ({movement:.1f}). Holding last stable readings.")
                else:
                    if new_hr > 30 and new_hr < 220:   # valid physiological range
                        hr   = new_hr
                    if new_spo2 > 50 and new_spo2 <= 100:
                        spo2 = new_spo2
            else:
                # Finger absent — reset displayed values
                hr = 0.0
                spo2 = 0.0

            # Compute current avg IR for server-side logging
            avg_ir_now = round(sum(_ir_window) / len(_ir_window), 0) if _ir_window else 0

            payload = {
                "heartRate":   hr,
                "spo2":        spo2,
                "accelX":      round(accel['x'], 4),
                "accelY":      round(accel['y'], 4),
                "accelZ":      round(accel['z'], 4),
                "gyroX":       round(gyro['x'],  3),
                "gyroY":       round(gyro['y'],  3),
                "gyroZ":       round(gyro['z'],  3),
                "movement":    movement,
                "temperature": round(temp, 2),
                # BP is not measured by these sensors — send 0 so the backend
                # doesn't crash; the frontend can hide/grey-out this field.
                "systolicBP":  0,
                "diastolicBP": 0,
                "timestamp":   int(time.time() * 1000),
                # Diagnostic fields — help debug sensor state from the server log
                "_avgIR":      avg_ir_now,
                "_bufFill":    len(ir_buffer),
                "_diag":       diag,
            }

            # ── POST to backend ───────────────────────────────────
            resp = requests.post(BACKEND_URL, json=payload, timeout=2)
            status = "✓" if resp.status_code == 200 else f"✗ {resp.status_code}"

            print(
                f"[{time.strftime('%H:%M:%S')}] {status}  "
                f"HR:{hr:5.1f} BPM  SpO2:{spo2:5.1f}%  "
                f"Temp:{temp:5.2f}°C  Mov:{movement:5.1f}  "
                f"| {diag}"
            )

        except requests.exceptions.ConnectionError:
            print(f"[{time.strftime('%H:%M:%S')}] ⚠  Cannot reach backend at {BACKEND_URL}")
        except requests.exceptions.Timeout:
            print(f"[{time.strftime('%H:%M:%S')}] ⚠  Request timed out")
        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] ❌  Error: {e}")

        # Maintain consistent interval regardless of processing time
        elapsed = time.time() - loop_start
        sleep_for = max(0.0, POLL_INTERVAL - elapsed)
        time.sleep(sleep_for)


if __name__ == "__main__":
    main()
