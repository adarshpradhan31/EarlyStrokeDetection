#!/usr/bin/env python3
"""
MAX30102 Raw Sensor Diagnostic
===============================
Run this DIRECTLY on the Raspberry Pi to check if the MAX30102 sensor
is working and what raw IR/RED values it is producing.

Usage:
    python3 raspberry_pi/test_max30102.py

No backend or network connection required.
"""

import time
import sys
from collections import deque

print("=" * 60)
print("  StrokeGuard MAX30102 Raw Diagnostic")
print("=" * 60)

# ── Step 1: Import sensor library ─────────────────────────────
try:
    import max30102
    print("[OK] max30102 library imported")
except ImportError:
    print("[FAIL] max30102 library not found")
    print("       Run: pip install max30102")
    sys.exit(1)

# ── Step 2: Initialise sensor ─────────────────────────────────
try:
    print("[..] Initialising MAX30102 at I²C address 0x57 ...")
    m = max30102.MAX30102()
    m.setup()
    print("[OK] MAX30102 initialised\n")
except Exception as e:
    print(f"[FAIL] Could not initialise MAX30102: {e}")
    print("       Check: i2cdetect -y 1  (should show 0x57)")
    sys.exit(1)

# ── Step 3: Wait for FIFO to fill a bit ──────────────────────
print("Waiting 1s for FIFO to fill ...")
time.sleep(1)

# ── Step 4: Read raw samples for 10 seconds ───────────────────
print()
print("Reading raw samples for 10 seconds.")
print("─── Place your finger on the sensor NOW ───")
print()
print(f"{'Time':>8}  {'FIFO':>5}  {'IR (raw)':>10}  {'RED (raw)':>10}  {'Finger?':>8}")
print("-" * 55)

ir_vals  = []
red_vals = []

start = time.time()
while time.time() - start < 10.0:
    n = m.get_data_present()
    if n > 0:
        for _ in range(n):
            red, ir = m.read_fifo()
            ir_vals.append(ir)
            red_vals.append(red)

        last_ir  = ir_vals[-1]
        last_red = red_vals[-1]
        finger   = "YES ✓" if last_ir > 30000 else "NO  ✗"
        elapsed  = time.time() - start
        print(f"{elapsed:8.2f}s  {n:5d}  {last_ir:10d}  {last_red:10d}  {finger:>8}")
    else:
        elapsed = time.time() - start
        print(f"{elapsed:8.2f}s  {'0 FIFO':>5}  {'—':>10}  {'—':>10}  {'—':>8}")

    time.sleep(0.5)

# ── Step 5: Summary ───────────────────────────────────────────
print()
print("=" * 60)
print("  SUMMARY")
print("=" * 60)
if not ir_vals:
    print("[FAIL] No samples collected at all.")
    print("       Check wiring and I²C connection.")
else:
    ir_min  = min(ir_vals)
    ir_max  = max(ir_vals)
    ir_mean = sum(ir_vals) // len(ir_vals)
    above   = sum(1 for v in ir_vals if v > 30000)
    pct     = above * 100 // len(ir_vals)

    print(f"  Total samples : {len(ir_vals)}")
    print(f"  IR min        : {ir_min:,}")
    print(f"  IR max        : {ir_max:,}")
    print(f"  IR mean       : {ir_mean:,}")
    print(f"  Above 30,000  : {above}/{len(ir_vals)} ({pct}%)")
    print()

    if ir_max < 5000:
        print("  ❌ DIAGNOSIS: Sensor is producing very low values.")
        print("     → Possible causes:")
        print("       1. Finger not placed on sensor")
        print("       2. Sensor wiring issue (SDA/SCL swapped?)")
        print("       3. MAX30102 VCC too low (needs 3.3V)")
        print("       4. Sensor is faulty/damaged")
    elif ir_max < 30000:
        print("  ⚠️  DIAGNOSIS: Sensor is working but signal is weak.")
        print(f"     → Best IR reading was {ir_max:,} (need > 30,000 for finger detection)")
        print("     → Try:")
        print("       1. Press finger flat and firmly — entire pad must cover LEDs")
        print("       2. Keep finger still for at least 5 seconds")
        print("       3. Try a different finger (index finger usually works best)")
        print("       4. Clean sensor surface with dry cloth")
    else:
        print("  ✅ DIAGNOSIS: Sensor is working correctly!")
        print(f"     → Max IR = {ir_max:,} (well above 30,000 threshold)")
        print("     → If SpO2 is still 0 in sensor_reader.py, restart it and")
        print("       wait ~5 seconds with finger on sensor for buffer to fill.")

print()
