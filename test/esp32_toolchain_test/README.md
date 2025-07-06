# ESP32 Toolchain Test

This directory contains a simple test program to verify your ESP32 toolchain setup.

## Purpose

The `esp32_toolchain_test.ino` program tests:
- ✅ Serial communication
- ✅ WiFi scanning capability
- ✅ JSON handling (ArduinoJson library)
- ✅ GPIO control (LED blinking)
- ✅ Basic sensor simulation
- ✅ Memory management

## How to Use

### Option 1: Arduino IDE
1. Open `esp32_toolchain_test.ino` in Arduino IDE
2. Select your ESP32 board (Tools → Board → ESP32 Arduino → ESP32 Dev Module)
3. Select the correct port (Tools → Port)
4. Click Upload (Ctrl+U)
5. Open Serial Monitor (Tools → Serial Monitor, set to 115200 baud)

### Option 2: PlatformIO
1. Copy the test folder to your PlatformIO project
2. Rename `esp32_toolchain_test.ino` to `main.cpp`
3. Run: `pio run --target upload`
4. Monitor: `pio device monitor`

### Option 3: ESP-IDF
1. Convert the Arduino code to ESP-IDF format (advanced users)
2. Use `idf.py build` and `idf.py flash`

## Expected Output

The program should output something like:
```
==========================================
🌱 Smart Irrigation System - ESP32 Test
==========================================
📋 ESP32 Information:
  Chip Model: ESP32
  Chip Revision: 1
  CPU Frequency: 240 MHz
  Flash Size: 4 MB
  Free Heap: 298756 bytes
  MAC Address: XX:XX:XX:XX:XX:XX

📡 Testing WiFi Scanning...
  Found 5 WiFi networks:
    1. MyWiFi (RSSI: -45 dBm)
    2. Neighbor_WiFi (RSSI: -67 dBm)
    ... etc

📄 Testing JSON Functionality...
  Generated JSON:
    {"device":"ESP32","project":"Smart Irrigation System","test":true,"timestamp":1234,"sensors":[{"type":"temperature","value":25.6,"unit":"°C"},{"type":"humidity","value":65.2,"unit":"%"}]}
  ✅ JSON parsing successful - Device: ESP32

✅ All tests completed successfully!
Your ESP32 toolchain is working correctly.
==========================================
Loop 1: LED ON, Free Heap: 298756 bytes
Loop 2: LED OFF, Free Heap: 298756 bytes
...
```

## Troubleshooting

### Common Issues

1. **Compilation Error**: Check if ArduinoJson library is installed
2. **Upload Error**: Check USB connection and port selection
3. **No Serial Output**: Check baud rate (should be 115200)
4. **WiFi Scan Fails**: Normal if no WiFi networks are nearby

### Required Libraries

Make sure these libraries are installed:
- WiFi (built-in)
- ArduinoJson

For PlatformIO, they're included in the `lib_deps` in `platformio.ini`.

## What This Test Proves

If this test runs successfully, your ESP32 toolchain can:
- Compile and upload code to ESP32
- Handle basic WiFi operations
- Process JSON data
- Control GPIO pins
- Communicate via serial

This means you're ready to work with the Smart Irrigation System firmware!
