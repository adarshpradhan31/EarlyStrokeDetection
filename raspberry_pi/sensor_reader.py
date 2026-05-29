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
BACKEND_IP   = os.environ.get("BACKEND_IP", "YOUR_PC_IP_HERE")  # e.g. 192.168.1.100
BACKEND_PORT = os.environ.get("BACKEND_PORT", "5000")
BACKEND_URL  = f"http://{BACKEND_IP}:{BACKEND_PORT}/api/sensor-data"
POLL_INTERVAL = 1.0   # seconds between POSTs

# MAX30102 configuration:
# Sensor sample rate is 100Hz. The heart rate algorithm expects a 100-sample buffer 
# representing 4.0 seconds of history at 25Hz.
# We accumulate 400 samples at 100Hz (4.0s of raw data) and downsample by taking every 4th sample.
RAW_BUFFER_SIZE = 400

# Thresholds for finger detection to prevent false readings
FINGER_PRESENT_THRESHOLD = 30000  # avg of last 5 samples must be above this for valid touch

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

# Circular buffers for IR and RED samples at 100Hz
ir_buffer  = deque(maxlen=RAW_BUFFER_SIZE)
red_buffer = deque(maxlen=RAW_BUFFER_SIZE)

# ── Helpers ──────────────────────────────────────────────────────
def compute_movement(accel: dict) -> float:
    """Convert accelerometer magnitude into a 0-100 movement index."""
    magnitude = math.sqrt(accel['x']**2 + accel['y']**2 + accel['z']**2)
    # Subtract gravity (~9.8 m/s²), scale and clamp to 0-100
    return round(max(0.0, min(100.0, abs(magnitude - 9.8) * 12)), 1)


def read_max30102() -> tuple[float, float]:
    """
    Drain MAX30102 FIFO, fill buffers with raw samples, and return (heart_rate, spo2).
    Returns (0, 0) if buffers are still filling. Downsamples from 100Hz to 25Hz.
    """
    n = m.get_data_present()
    for _ in range(n):
        red, ir = m.read_fifo()
        red_buffer.append(red)
        ir_buffer.append(ir)

    if len(ir_buffer) < RAW_BUFFER_SIZE:
        return 0.0, 0.0

    # Downsample from 100Hz to 25Hz by taking every 4th sample
    ir_25hz = [list(ir_buffer)[i] for i in range(0, RAW_BUFFER_SIZE, 4)]
    red_25hz = [list(red_buffer)[i] for i in range(0, RAW_BUFFER_SIZE, 4)]

    hr_val, hr_valid, spo2_val, spo2_valid = hrcalc.calc_hr_and_spo2(
        ir_25hz, red_25hz
    )
    hr   = round(float(hr_val),   1) if hr_valid   else 0.0
    spo2 = round(float(spo2_val), 1) if spo2_valid else 0.0
    return hr, spo2


def is_finger_present() -> bool:
    """
    Checks if a finger is currently placed on the MAX30102 sensor.
    Uses a moving average of the last 5 samples (or all available if < 5) to avoid noise spikes.
    """
    if len(ir_buffer) == 0:
        return False
    # Check the average of the last 5 samples (or all available) to avoid noise spikes
    num_samples = min(len(ir_buffer), 5)
    last_samples = list(ir_buffer)[-num_samples:]
    avg_ir = sum(last_samples) / num_samples
    return avg_ir > FINGER_PRESENT_THRESHOLD


# ── Main loop ────────────────────────────────────────────────────
def main():
    print(f"\n✅  StrokeGuard Sensor Reader started")
    print(f"   → Posting to: {BACKEND_URL}")
    print(f"   → Interval:   {POLL_INTERVAL}s\n")
    print("   Collecting MAX30102 samples (needs ~400 before HR/SpO2 are valid)...\n")

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
            new_hr, new_spo2 = read_max30102()
            
            if is_finger_present():
                # Motion artifact prevention: PPG values are highly unstable during movement.
                # If movement is high (> 15.0), ignore the new readings to prevent false spikes.
                if movement > 15.0:
                    print(f"  ⚠ High movement detected ({movement}). Holding last stable readings to prevent false alerts.")
                else:
                    if new_hr > 30 and new_hr < 220:   # valid physiological range
                        hr   = new_hr
                    if new_spo2 > 50 and new_spo2 <= 100:
                        spo2 = new_spo2
            else:
                # Print diagnostic info if we have some readings but they are below threshold
                if len(ir_buffer) > 0:
                    num_samples = min(len(ir_buffer), 5)
                    last_samples = list(ir_buffer)[-num_samples:]
                    avg_ir = sum(last_samples) / num_samples
                    print(f"  ⚠ Finger detected but signal too weak. Avg IR: {avg_ir:.0f} (Need > {FINGER_PRESENT_THRESHOLD})")

                # No finger detected: reset to 0.0 immediately
                hr = 0.0
                spo2 = 0.0
                ir_buffer.clear()
                red_buffer.clear()

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
            }

            # ── POST to backend ───────────────────────────────────
            resp = requests.post(BACKEND_URL, json=payload, timeout=2)
            status = "✓" if resp.status_code == 200 else f"✗ {resp.status_code}"

            print(
                f"[{time.strftime('%H:%M:%S')}] {status}  "
                f"HR:{hr:5.1f} BPM  SpO2:{spo2:5.1f}%  "
                f"Temp:{temp:5.2f}°C  Mov:{movement:5.1f}  "
                f"Gyro({gyro['x']:+.1f}, {gyro['y']:+.1f}, {gyro['z']:+.1f}) °/s"
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
