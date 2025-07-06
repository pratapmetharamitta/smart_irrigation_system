# ESP32 Quick Reference

## Compilation Commands

### Arduino IDE
```bash
# GUI-based compilation
# Sketch → Verify/Compile (Ctrl+R)
# Sketch → Upload (Ctrl+U)
```

### PlatformIO
```bash
# Initialize project
pio project init --board esp32dev

# Install dependencies
pio pkg install

# Compile
pio run

# Upload
pio run --target upload

# Monitor serial output
pio device monitor

# Clean build
pio run --target clean

# List available boards
pio boards espressif32

# Update platforms
pio platform update
```

### ESP-IDF
```bash
# Set up environment (run once per terminal session)
. $HOME/esp/esp-idf/export.sh
# or use alias: get_idf

# Create project
idf.py create-project project_name

# Configure project
idf.py menuconfig

# Build
idf.py build

# Flash
idf.py flash

# Monitor
idf.py monitor

# Flash and monitor
idf.py flash monitor

# Clean
idf.py clean

# Set target (if different from default)
idf.py set-target esp32s3
```

## Board Selection

### Common ESP32 Boards
- **ESP32 Dev Module**: Generic ESP32 development board
- **TTGO T-SIM7000G**: ESP32 with SIM7000G cellular modem
- **ESP32-S3**: Latest ESP32 variant with more RAM
- **ESP32-C3**: RISC-V based ESP32

### PlatformIO Board IDs
```ini
[env:esp32dev]
board = esp32dev

[env:ttgo-t-sim7000g]
board = ttgo-t-sim7000g

[env:esp32-s3]
board = esp32-s3-devkitc-1

[env:esp32-c3]
board = esp32-c3-devkitc-02
```

## Serial Communication

### Find Serial Port
```bash
# macOS
ls /dev/cu.*

# Linux
ls /dev/ttyUSB* /dev/ttyACM*

# Windows
# Check Device Manager → Ports (COM & LPT)
```

### Serial Monitor Commands
```bash
# PlatformIO
pio device monitor --port /dev/cu.usbserial-xxx --baud 115200

# ESP-IDF
idf.py monitor --port /dev/cu.usbserial-xxx

# Screen (built-in macOS/Linux)
screen /dev/cu.usbserial-xxx 115200
```

## Library Management

### Arduino IDE
```bash
# Install via Library Manager
Tools → Manage Libraries → Search and Install
```

### PlatformIO
```bash
# Install library
pio pkg install --library "bblanchon/ArduinoJson@^6.21.3"

# List installed libraries
pio pkg list

# Update libraries
pio pkg update

# Search for libraries
pio pkg search ArduinoJson
```

### ESP-IDF
```bash
# Add component
idf.py add-dependency "espressif/esp32-camera"

# Update dependencies
idf.py update-dependencies
```

## Troubleshooting

### Common Upload Issues
```bash
# Reduce upload speed
# Arduino IDE: Tools → Upload Speed → 115200
# PlatformIO: upload_speed = 115200

# Hold BOOT button during upload
# or add to platformio.ini:
upload_flags = --before=default_reset --after=hard_reset
```

### Memory Issues
```bash
# Check memory usage
# Arduino IDE: After compilation, check output
# PlatformIO: pio run --verbose
# ESP-IDF: idf.py size
```

### Clean Build
```bash
# Arduino IDE: Tools → Clean Build Folder
# PlatformIO: pio run --target clean
# ESP-IDF: idf.py clean
```

## Essential Libraries for Smart Irrigation

### Communication
```cpp
#include <WiFi.h>           // WiFi connectivity
#include <HTTPClient.h>     // HTTP requests
#include <PubSubClient.h>   // MQTT
#include <TinyGsmClient.h>  // Cellular (SIM7000G)
#include <LoRa.h>           // LoRa communication
```

### Data Handling
```cpp
#include <ArduinoJson.h>    // JSON processing
#include <Preferences.h>    // Non-volatile storage
#include <SPIFFS.h>         // File system
```

### Sensors
```cpp
#include <DHT.h>            // Temperature/humidity
#include <OneWire.h>        // DS18B20 temperature
#include <Wire.h>           // I2C communication
#include <SPI.h>            // SPI communication
```

## Pin Configurations

### T-SIM7000G
```cpp
#define MODEM_RST     5
#define MODEM_PWKEY   4
#define MODEM_TX      26
#define MODEM_RX      27
#define LORA_SCK      18
#define LORA_MISO     19
#define LORA_MOSI     23
#define LORA_CS       16
#define LORA_RST      14
#define LORA_DIO0     32
```

### Generic ESP32
```cpp
#define SDA_PIN       21
#define SCL_PIN       22
#define LED_PIN       2
#define ADC_PIN       A0
```

## Build Flags

### Common Build Flags
```ini
build_flags = 
    -DARDUINO_USB_CDC_ON_BOOT=1  # Enable USB CDC
    -DCORE_DEBUG_LEVEL=3         # Debug level
    -DTTGO_T_SIM7000G           # Board specific
    -DTINY_GSM_MODEM_SIM7000    # Modem type
```

## Performance Optimization

### Reduce Binary Size
```ini
build_flags = 
    -Os                          # Optimize for size
    -ffunction-sections          # Remove unused functions
    -fdata-sections
    -Wl,--gc-sections
```

### Increase Performance
```ini
build_flags = 
    -O2                          # Optimize for speed
    -DCONFIG_FREERTOS_HZ=1000   # Increase tick rate
```

## Quick Test Commands

```bash
# Test compilation without upload
pio run --target build

# Check board info
pio boards espressif32 | grep -i t-sim

# Monitor without upload
pio device monitor

# Flash specific firmware
esptool.py --chip esp32 --port /dev/cu.usbserial-xxx write_flash 0x1000 firmware.bin
```
