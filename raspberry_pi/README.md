# StrokeGuard AI — Raspberry Pi Setup

## Hardware Required

| Component | Purpose |
|-----------|---------|
| Raspberry Pi 4 (4GB) | Main controller |
| MPU6050 | Accelerometer + Gyroscope |
| MAX30102 | Heart Rate + SpO2 |
| Jumper wires | Connections |

---

## Wiring Diagram

### MPU6050 → Raspberry Pi 4
```
MPU6050 Pin   →   RPi 4 Physical Pin
─────────────────────────────────────
VCC           →   Pin 1  (3.3V)
GND           →   Pin 6  (GND)
SDA           →   Pin 3  (GPIO 2, SDA1)
SCL           →   Pin 5  (GPIO 3, SCL1)
```

### MAX30102 → Raspberry Pi 4
```
MAX30102 Pin  →   RPi 4 Physical Pin
─────────────────────────────────────
VIN           →   Pin 1  (3.3V)   ← share with MPU6050
GND           →   Pin 9  (GND)
SDA           →   Pin 3  (GPIO 2) ← shared I²C bus
SCL           →   Pin 5  (GPIO 3) ← shared I²C bus
```

> Both sensors share the **same I²C bus**.  
> MPU6050 address: `0x68`  
> MAX30102 address: `0x57`

### RPi 4 GPIO Pinout (relevant pins)
```
        3.3V [1] [2] 5V
SDA1 GPIO2 [3] [4] 5V
SCL1 GPIO3 [5] [6] GND
           ...
       GND [9] [10] GPIO15
```

---

## Software Setup on Raspberry Pi

### 1. Enable I²C
```bash
sudo raspi-config
# Navigate to: Interface Options → I2C → Enable → Reboot
```

### 2. Verify sensors are detected
```bash
sudo i2cdetect -y 1
# You should see:
#   0x57 (MAX30102)
#   0x68 (MPU6050)
```

### 3. Install Python dependencies
```bash
cd /path/to/strokeguard-ai/raspberry_pi
pip install -r requirements.txt
```

### 4. Configure backend IP
Edit `sensor_reader.py` and set your PC's local IP:
```python
BACKEND_IP = "192.168.1.xxx"   # ← replace with your PC's LAN IP
```

**To find your PC's IP on Windows:**
```powershell
ipconfig
# Look for: IPv4 Address . . . . . . . . . . : 192.168.x.x
```

### 5. Run the sensor reader
```bash
python3 sensor_reader.py

# Or pass IP as environment variable:
BACKEND_IP=192.168.1.100 python3 sensor_reader.py
```

Expected output:
```
✅  StrokeGuard Sensor Reader started
   → Posting to: http://192.168.1.100:5000/api/sensor-data
   → Interval:   1.0s

   Collecting MAX30102 samples (needs ~100 before HR/SpO2 are valid)...

[22:31:05] ✓  HR:  72.0 BPM  SpO2: 98.2%  Temp:36.45°C  Mov:  3.1  Gyro(+0.1, -0.2, +0.0) °/s
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `No module named 'mpu6050'` | `pip install mpu6050-raspberrypi` |
| `No module named 'max30102'` | `pip install max30102` |
| `i2cdetect` shows no devices | Check wiring; ensure I²C is enabled |
| HR/SpO2 shows 0 | Keep finger still on sensor for ~10s to fill buffer |
| Cannot reach backend | Check firewall on PC; ensure both on same Wi-Fi |
| `Remote end closed connection` | Backend server not running — run `npm run dev` on PC |

---

## Run as a Service (Auto-start on Boot)

```bash
sudo nano /etc/systemd/system/strokeguard.service
```
```ini
[Unit]
Description=StrokeGuard AI Sensor Reader
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/strokeguard-ai/raspberry_pi/sensor_reader.py
Restart=always
User=pi
Environment=BACKEND_IP=192.168.1.100

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable strokeguard
sudo systemctl start strokeguard
sudo systemctl status strokeguard
```
