# ESP32 Toolchain Setup Guide

This guide covers the setup of ESP-IDF (Espressif IoT Development Framework) for compiling ESP32 code for the Smart Irrigation System project.

## Overview

This project uses **ESP-IDF** - the official development framework from Espressif for ESP32 chips. ESP-IDF provides the most comprehensive set of features, professional debugging capabilities, direct access to ESP32 hardware features, and is the recommended approach for production IoT systems.

## Prerequisites

Before starting, ensure you have the following installed on macOS:

```bash
# Install required tools via Homebrew
brew install cmake ninja dfu-util python3

# Install Git (if not already installed)
brew install git

# Install USB drivers for ESP32 boards
brew install homebrew/cask-drivers/wch-ch34x-usb-serial-driver
```

## ESP-IDF Installation

### 1. Clone ESP-IDF Repository

```bash
# Create a directory for ESP-IDF
mkdir -p ~/esp
cd ~/esp

# Clone the ESP-IDF repository
git clone --recursive https://github.com/espressif/esp-idf.git

# Navigate to ESP-IDF directory
cd esp-idf

# Check out the stable release (recommended)
git checkout v5.1.2
git submodule update --init --recursive
```

### 2. Install ESP-IDF Tools

```bash
# Install ESP-IDF tools and dependencies
./install.sh esp32

# Set up environment variables (add to ~/.zshrc for persistence)
. ./export.sh
```

### 3. Make Environment Variables Persistent

Add ESP-IDF to your shell profile for automatic loading:

```bash
# Add to ~/.zshrc
echo 'alias get_idf=". ~/esp/esp-idf/export.sh"' >> ~/.zshrc

# Or add the export command directly
echo '. ~/esp/esp-idf/export.sh' >> ~/.zshrc

# Reload shell configuration
source ~/.zshrc
```

## Project Setup

### 1. Create Project from Template

```bash
# Create project directory
mkdir -p ~/Projects/smart_irrigation_edge
cd ~/Projects/smart_irrigation_edge

# Initialize ESP-IDF project
idf.py create-project smart_irrigation_edge

# Navigate to project directory
cd smart_irrigation_edge
```

### 2. Project Structure

ESP-IDF projects follow a specific structure:

```
smart_irrigation_edge/
├── CMakeLists.txt              # Main CMake file
├── main/
│   ├── CMakeLists.txt         # Main component CMake file
│   ├── main.c                 # Main application source
│   └── Kconfig.projbuild      # Project configuration
├── components/                # Custom components
│   ├── EdgeLoRa/
│   │   ├── CMakeLists.txt
│   │   ├── include/
│   │   │   └── EdgeLoRa.h
│   │   └── EdgeLoRa.c
│   └── EdgeCellular/
│       ├── CMakeLists.txt
│       ├── include/
│       │   └── EdgeCellular.h
│       └── EdgeCellular.c
├── sdkconfig                  # SDK configuration
└── README.md
```

### 3. Configure Project

```bash
# Configure project settings
idf.py menuconfig
```

Key configuration options for Smart Irrigation System:
- **Serial flasher config** → Flash size: 4MB
- **Compiler options** → Optimization level: Release (-Os)
- **Component config** → ESP32-specific → CPU frequency: 240 MHz
- **Component config** → FreeRTOS → Tick rate: 1000 Hz
- **Component config** → WiFi** → WiFi Task Core ID: 0

## Hardware-Specific Configuration

### T-SIM7000G Board Configuration

For the T-SIM7000G board used in this project, create a custom board configuration:

```c
// main/board_config.h
#ifndef BOARD_CONFIG_H
#define BOARD_CONFIG_H

// T-SIM7000G Pin Definitions
#define MODEM_RST_PIN     GPIO_NUM_5
#define MODEM_PWKEY_PIN   GPIO_NUM_4
#define MODEM_DTR_PIN     GPIO_NUM_25
#define MODEM_UART_TXD    GPIO_NUM_26
#define MODEM_UART_RXD    GPIO_NUM_27
#define MODEM_UART_NUM    UART_NUM_1

// I2C Configuration
#define I2C_SDA_PIN       GPIO_NUM_21
#define I2C_SCL_PIN       GPIO_NUM_22
#define I2C_FREQ_HZ       400000

// LoRa SPI Configuration
#define LORA_SCK_PIN      GPIO_NUM_18
#define LORA_MISO_PIN     GPIO_NUM_19
#define LORA_MOSI_PIN     GPIO_NUM_23
#define LORA_CS_PIN       GPIO_NUM_16
#define LORA_RST_PIN      GPIO_NUM_14
#define LORA_DIO0_PIN     GPIO_NUM_32

// Additional GPIOs
#define LED_PIN           GPIO_NUM_12
#define BUTTON_PIN        GPIO_NUM_35

#endif // BOARD_CONFIG_H
```

### Component Configuration

Create `main/CMakeLists.txt`:

```cmake
idf_component_register(
    SRCS 
        "main.c"
        "sensors.c"
        "communication.c"
        "utils.c"
    INCLUDE_DIRS 
        "."
    REQUIRES 
        driver 
        esp_wifi 
        esp_http_client 
        mqtt 
        json 
        nvs_flash
        EdgeLoRa
        EdgeCellular
)
```

## Building and Flashing

### Basic Commands

```bash
# Build the project
idf.py build

# Flash to device
idf.py flash

# Monitor serial output
idf.py monitor

# Flash and monitor in one command
idf.py flash monitor

# Clean build files
idf.py clean
```

### Advanced Commands

```bash
# Build with verbose output
idf.py build -v

# Flash to specific port
idf.py --port /dev/cu.usbserial-0001 flash

# Flash with custom baud rate
idf.py --baud 921600 flash

# Show project size information
idf.py size

# Generate project configuration
idf.py save-defconfig
```

## Custom Components

### Creating EdgeLoRa Component

Create `components/EdgeLoRa/CMakeLists.txt`:

```cmake
idf_component_register(
    SRCS 
        "EdgeLoRa.c"
    INCLUDE_DIRS 
        "include"
    REQUIRES 
        driver 
        esp_common
)
```

Create `components/EdgeLoRa/include/EdgeLoRa.h`:

```c
#ifndef EDGE_LORA_H
#define EDGE_LORA_H

#include <stdint.h>
#include <stdbool.h>

// LoRa configuration
typedef struct {
    uint32_t frequency;
    uint8_t spreading_factor;
    uint8_t bandwidth;
    uint8_t coding_rate;
    uint8_t tx_power;
} lora_config_t;

// Function declarations
esp_err_t edge_lora_init(lora_config_t* config);
esp_err_t edge_lora_send(const uint8_t* data, size_t length);
esp_err_t edge_lora_receive(uint8_t* data, size_t* length, uint32_t timeout_ms);
esp_err_t edge_lora_deinit(void);

#endif // EDGE_LORA_H
```

### Creating EdgeCellular Component

Create `components/EdgeCellular/CMakeLists.txt`:

```cmake
idf_component_register(
    SRCS 
        "EdgeCellular.c"
    INCLUDE_DIRS 
        "include"
    REQUIRES 
        driver 
        esp_common
        esp_http_client
        json
)
```

## Main Application Structure

Create `main/main.c`:

```c
#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "nvs_flash.h"

#include "board_config.h"
#include "EdgeLoRa.h"
#include "EdgeCellular.h"

static const char* TAG = "SMART_IRRIGATION";

void app_main(void)
{
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    ESP_LOGI(TAG, "Smart Irrigation System Edge Device Starting...");

    // Initialize components
    // TODO: Initialize sensors, LoRa, cellular, etc.

    // Main application loop
    while (1) {
        // Handle sensor readings
        // Process LoRa communications
        // Send data to cloud via cellular
        
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
```

## Debugging and Monitoring

### Serial Monitor

```bash
# Basic monitoring
idf.py monitor

# Monitor with custom baud rate
idf.py monitor --baud 115200

# Monitor with timestamp
idf.py monitor --timestamps

# Exit monitor: Ctrl+]
```

### Logging Configuration

Configure logging levels in `sdkconfig`:

```
CONFIG_LOG_DEFAULT_LEVEL_INFO=y
CONFIG_LOG_MAXIMUM_LEVEL_DEBUG=y
CONFIG_LOG_COLORS=y
```

Or via menuconfig:
- `Component config` → `Log output` → `Default log verbosity`

### Debug Output

Use ESP-IDF logging macros:

```c
#include "esp_log.h"

static const char* TAG = "MY_MODULE";

ESP_LOGE(TAG, "Error message");
ESP_LOGW(TAG, "Warning message");
ESP_LOGI(TAG, "Info message");
ESP_LOGD(TAG, "Debug message");
ESP_LOGV(TAG, "Verbose message");
```

## Performance Optimization

### Memory Management

```c
// Check free heap
size_t free_heap = esp_get_free_heap_size();
ESP_LOGI(TAG, "Free heap: %d bytes", free_heap);

// Check minimum free heap
size_t min_free_heap = esp_get_minimum_free_heap_size();
ESP_LOGI(TAG, "Minimum free heap: %d bytes", min_free_heap);
```

### Task Configuration

```c
// Create task with specific stack size
xTaskCreate(
    my_task,           // Task function
    "my_task",         // Task name
    4096,              // Stack size (bytes)
    NULL,              // Task parameters
    5,                 // Priority
    NULL               // Task handle
);
```

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clean and rebuild
   idf.py clean
   idf.py build
   
   # Update submodules
   git submodule update --init --recursive
   ```

2. **Flash Errors**
   ```bash
   # Check port connection
   ls /dev/cu.usbserial*
   
   # Try different baud rate
   idf.py --baud 115200 flash
   
   # Erase flash completely
   idf.py erase_flash
   ```

3. **Monitor Issues**
   ```bash
   # Check port permissions
   sudo chmod 666 /dev/cu.usbserial*
   
   # Reset ESP32 board manually
   # Press and hold BOOT + EN, release EN, then release BOOT
   ```

## Production Deployment

### Over-the-Air (OTA) Updates

Enable OTA in `sdkconfig`:

```
CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE=y
CONFIG_BOOTLOADER_APP_ANTI_ROLLBACK=y
```

### Security Configuration

```
CONFIG_SECURE_BOOT=y
CONFIG_SECURE_FLASH_ENC_ENABLED=y
CONFIG_SECURE_FLASH_ENCRYPTION_MODE_DEVELOPMENT=y
```

### Partition Configuration

Create `partitions.csv`:

```
# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x6000,
phy_init, data, phy,     0xf000,  0x1000,
factory,  app,  factory, 0x10000, 1M,
ota_0,    app,  ota_0,   0x110000, 1M,
ota_1,    app,  ota_1,   0x210000, 1M,
spiffs,   data, spiffs,  0x310000, 0xF0000,
```

## Quick Start Script

Create `setup_esp32_env.sh`:

```bash
#!/bin/bash
# ESP32 Development Environment Setup Script

set -e

echo "Setting up ESP32 development environment..."

# Install dependencies
brew install cmake ninja dfu-util python3 git

# Install USB drivers
brew install homebrew/cask-drivers/wch-ch34x-usb-serial-driver

# Create ESP directory
mkdir -p ~/esp
cd ~/esp

# Clone ESP-IDF
if [ ! -d "esp-idf" ]; then
    git clone --recursive https://github.com/espressif/esp-idf.git
fi

cd esp-idf
git checkout v5.1.2
git submodule update --init --recursive

# Install ESP-IDF
./install.sh esp32

# Add to shell profile
echo 'alias get_idf=". ~/esp/esp-idf/export.sh"' >> ~/.zshrc

echo "Setup complete! Run 'get_idf' to activate ESP-IDF environment."
```

## Next Steps

1. **Set up environment**: Run the setup script or follow manual installation
2. **Create your first project**: Use `idf.py create-project`
3. **Configure the project**: Run `idf.py menuconfig`
4. **Build and flash**: Use `idf.py build flash monitor`
5. **Explore examples**: Check out the ESP-IDF examples in `~/esp/esp-idf/examples/`

For project-specific firmware, start with:
- `Edge/EdgeEnhanced.ino` - Convert to ESP-IDF format
- `Node/LoRa/LoRa.ino` - Port to ESP-IDF components

## Additional Resources

- [ESP-IDF Programming Guide](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [ESP32 Technical Reference Manual](https://www.espressif.com/sites/default/files/documentation/esp32_technical_reference_manual_en.pdf)
- [ESP-IDF API Reference](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/index.html)
- [ESP32 Hardware Design Guidelines](https://www.espressif.com/sites/default/files/documentation/esp32_hardware_design_guidelines_en.pdf)
