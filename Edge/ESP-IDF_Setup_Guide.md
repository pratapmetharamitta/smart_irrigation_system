# ESP-IDF Development Environment Setup Guide

This guide will help you set up the ESP-IDF (Espressif IoT Development Framework) for developing firmware for the Smart Irrigation System ESP32 devices.

## Prerequisites

- macOS (this guide is for macOS, but similar steps apply to Linux/Windows)
- Xcode Command Line Tools
- Python 3.8+ (Python 3.13 may have compatibility issues)

## Installation Steps

### 1. Install Dependencies

```bash
# Install Xcode Command Line Tools (if not already installed)
xcode-select --install

# Check Python version (should be 3.8 or later, but avoid 3.13)
python3 --version
```

### 2. Download ESP-IDF

```bash
# Create esp directory in home folder
mkdir -p ~/esp
cd ~/esp

# Clone ESP-IDF (stable release v5.1)
git clone -b v5.1.2 --recursive https://github.com/espressif/esp-idf.git
```

### 3. Install ESP-IDF Tools

```bash
cd ~/esp/esp-idf

# Run installation script with Python 3.8 (important for compatibility)
python3.8 tools/idf_tools.py install-python-env
python3.8 tools/idf_tools.py install
```

### 4. Set Up Environment

```bash
# Add ESP-IDF alias to your shell configuration
echo 'alias get_idf=". $HOME/esp/esp-idf/export.sh"' >> ~/.zshrc

# Reload your shell configuration
source ~/.zshrc
```

### 5. Activate ESP-IDF Environment

Every time you want to use ESP-IDF, run:

```bash
get_idf
```

This will set up all the necessary environment variables and add ESP-IDF tools to your PATH.

## Verification

### Test the Installation

```bash
# Activate ESP-IDF environment
get_idf

# Check ESP-IDF version
idf.py --version

# Check toolchain
xtensa-esp32-elf-gcc --version

# Check esptool
esptool.py version
```

### Build Example Project

```bash
# Create test directory
mkdir -p ~/esp_projects/test
cd ~/esp_projects/test

# Copy hello world example
cp -r $IDF_PATH/examples/get-started/hello_world .
cd hello_world

# Build the project
idf.py build
```

If the build completes successfully, your ESP-IDF installation is working correctly!

## Project Structure

For the Smart Irrigation System, we recommend this structure:

```
smart_irrigation_system/
├── Edge/
│   ├── SmartIrrigationFirmware.ino     # Main firmware (Arduino-style)
│   ├── esp-idf/                        # ESP-IDF native projects
│   │   ├── main_controller/
│   │   ├── sensor_node/
│   │   └── gateway/
│   ├── libraries/                       # Custom libraries
│   └── README.md
├── cloud-backend/
├── mobile-app/
└── docs/
```

## Development Workflow

### 1. Create New ESP-IDF Project

```bash
# Activate ESP-IDF environment
get_idf

# Create new project
cd ~/esp_projects
cp -r $IDF_PATH/examples/get-started/hello_world my_irrigation_project
cd my_irrigation_project

# Configure project
idf.py menuconfig

# Build project
idf.py build

# Flash to device (replace PORT with actual port)
idf.py -p /dev/cu.usbserial-* flash

# Monitor serial output
idf.py -p /dev/cu.usbserial-* monitor
```

### 2. Find Connected ESP32 Devices

```bash
# List USB devices
ls /dev/cu.*

# Common ESP32 device names:
# /dev/cu.usbserial-*
# /dev/cu.SLAB_USBtoUART
# /dev/cu.wchusbserial*
```

### 3. Configure Project

The `idf.py menuconfig` command opens a configuration menu where you can:
- Set WiFi credentials
- Configure serial port settings
- Enable/disable components
- Set partition table
- Configure security settings

## Common Commands

```bash
# Build project
idf.py build

# Clean build files
idf.py clean

# Flash firmware to device
idf.py -p [PORT] flash

# Monitor serial output
idf.py -p [PORT] monitor

# Flash and monitor in one command
idf.py -p [PORT] flash monitor

# Set target (esp32, esp32s2, esp32s3, esp32c3, etc.)
idf.py set-target esp32

# Show project size
idf.py size

# Create component
idf.py create-component my_component
```

## Troubleshooting

### Python Version Issues

If you encounter Python compatibility issues:

```bash
# Check available Python versions
ls /Library/Frameworks/Python.framework/Versions/

# Use specific Python version for installation
/Library/Frameworks/Python.framework/Versions/3.8/bin/python3.8 install.py
```

### SSL Certificate Issues

If you get SSL certificate errors:

```bash
# Run Python certificate installation
/Applications/Python\ 3.8/Install\ Certificates.command
```

### Permission Issues

```bash
# Fix permissions for ESP32 device access
sudo dseditgroup -o edit -a whoami -t user _developer
```

### Build Errors

1. **Clean and rebuild:**
   ```bash
   idf.py clean
   idf.py build
   ```

2. **Check ESP-IDF environment:**
   ```bash
   echo $IDF_PATH
   echo $PATH | grep esp
   ```

3. **Update submodules:**
   ```bash
   cd $IDF_PATH
   git submodule update --recursive
   ```

## IDE Integration

### VS Code Setup

1. Install the ESP-IDF VS Code extension
2. Configure extension settings:
   - ESP-IDF Path: `/Users/[username]/esp/esp-idf`
   - Python Path: `/Users/[username]/.espressif/python_env/idf5.1_py3.8_env/bin/python`

### Arduino IDE (Alternative)

For simpler development, you can also use Arduino IDE with ESP32 board package:

1. Install Arduino IDE
2. Add ESP32 board package URL in preferences:
   `https://dl.espressif.com/dl/package_esp32_index.json`
3. Install ESP32 boards via Board Manager
4. Use the provided `.ino` files

## Hardware Configuration

### Pin Mapping for Smart Irrigation System

```
ESP32 Pin | Function           | Component
----------|-------------------|------------------
GPIO 4    | DHT22 Data        | Temperature/Humidity
GPIO 2    | DS18B20 Data      | Soil Temperature
GPIO 36   | Soil Moisture     | Analog Sensor
GPIO 5    | Pump Relay        | Water Pump Control
GPIO 18   | Valve Relay       | Solenoid Valve
GPIO 13   | Status LED        | System Status
GPIO 0    | Manual Button     | Manual Override
GPIO 21   | I2C SDA           | Display/Sensors
GPIO 22   | I2C SCL           | Display/Sensors
```

## Next Steps

1. **Test Hardware:** Connect sensors and test basic functionality
2. **WiFi Configuration:** Set up WiFi credentials for cloud connectivity
3. **MQTT Setup:** Configure MQTT broker connection
4. **Sensor Calibration:** Calibrate soil moisture sensors
5. **Cloud Integration:** Test communication with backend services

## Resources

- [ESP-IDF Programming Guide](https://docs.espressif.com/projects/esp-idf/en/stable/)
- [ESP32 Technical Reference](https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf)
- [ESP-IDF GitHub Repository](https://github.com/espressif/esp-idf)
- [Smart Irrigation System Documentation](./docs/)
