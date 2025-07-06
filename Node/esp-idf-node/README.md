# Smart Irrigation Node - ESP-IDF Implementation

This is an ESP-IDF compatible implementation of the Smart Irrigation Node system, converted from the original Arduino-based LoRa node code.

## Overview

The Smart Irrigation Node is responsible for:
- Reading soil moisture and temperature sensors
- Controlling irrigation valves based on sensor data or remote commands
- Communicating with the Edge device via LoRa
- Optional WiFi connectivity for diagnostics and configuration
- OLED display for status information

## Hardware Support

### Supported Boards
- **TTGO LoRa32 V1.0** (with OLED)
- **TTGO LoRa32 V1.2** (with OLED and DS3231 RTC)
- **TTGO LoRa32 V1.6** (with OLED and SD card)
- **TTGO LoRa32 V2.0** (with OLED and SD card) - **Default**

### Pin Configurations

#### TTGO LoRa32 V2.0 (Default)
| Function | Pin | GPIO |
|----------|-----|------|
| OLED SDA | 21 | GPIO_NUM_21 |
| OLED SCL | 22 | GPIO_NUM_22 |
| LoRa MOSI | 27 | GPIO_NUM_27 |
| LoRa MISO | 19 | GPIO_NUM_19 |
| LoRa CLK | 5 | GPIO_NUM_5 |
| LoRa CS | 18 | GPIO_NUM_18 |
| LoRa RST | 23 | GPIO_NUM_23 |
| LoRa DIO0 | 26 | GPIO_NUM_26 |
| SD Card MOSI | 15 | GPIO_NUM_15 |
| SD Card MISO | 2 | GPIO_NUM_2 |
| SD Card CLK | 14 | GPIO_NUM_14 |
| SD Card CS | 13 | GPIO_NUM_13 |

#### Irrigation System Pins
| Function | Pin | GPIO |
|----------|-----|------|
| Valve 1 | 16 | GPIO_NUM_16 |
| Valve 2 | 17 | GPIO_NUM_17 |
| Valve 3 | 18 | GPIO_NUM_18 |
| Valve 4 | 19 | GPIO_NUM_19 |
| Soil Sensor 1 | 32 | ADC_CHANNEL_4 |
| Soil Sensor 2 | 33 | ADC_CHANNEL_5 |
| Soil Sensor 3 | 34 | ADC_CHANNEL_6 |
| Soil Sensor 4 | 35 | ADC_CHANNEL_7 |
| Temperature Sensor | 36 | ADC_CHANNEL_0 |

## Configuration

### Board Selection
In `main/node_config.h`, set the appropriate board version:
```c
#define LORA_V1_0_OLED  0
#define LORA_V1_2_OLED  0
#define LORA_V1_6_OLED  0
#define LORA_V2_0_OLED  1  // Set to 1 for your board
```

### LoRa Frequency
Set the LoRa frequency according to your region:
```c
#define LORA_FREQUENCY  433  // 433, 868, or 915 MHz
```

### Node Mode
Configure if this node is a sender or receiver:
```c
#define NODE_IS_SENDER  0  // 0 = Receiver, 1 = Sender
```

### WiFi Configuration
Update WiFi credentials in `main/smart_irrigation_node.c`:
```c
#define WIFI_SSID           "YourWiFiSSID"
#define WIFI_PASSWORD       "YourWiFiPassword"
```

## Building and Flashing

### Prerequisites
- ESP-IDF v5.0 or later
- ESP32 development board (TTGO LoRa32 series)

### Build Process
1. Navigate to the project directory:
   ```bash
   cd Node/esp-idf-node
   ```

2. Configure the project:
   ```bash
   idf.py menuconfig
   ```

3. Build the project:
   ```bash
   idf.py build
   ```

4. Flash to device:
   ```bash
   idf.py -p /dev/ttyUSB0 flash monitor
   ```

## Features

### Implemented Features
✅ **Core System**
- GPIO initialization for valves and sensors
- ADC initialization for sensor readings
- WiFi connectivity with automatic reconnection
- Multi-task architecture using FreeRTOS

✅ **Sensor Management**
- Soil moisture sensor reading (4 channels)
- Temperature sensor reading
- Configurable reading intervals
- Sensor data logging

✅ **Valve Control**
- Individual valve control (4 valves)
- Remote command processing
- Safety interlocks and timeouts

✅ **Communication Framework**
- LoRa communication framework (SPI initialized)
- Command parsing and execution
- Data packet formatting

### Pending Implementation
⏳ **LoRa Protocol**
- Complete LoRa driver implementation
- Packet transmission and reception
- Error handling and retry logic

⏳ **OLED Display**
- SSD1306 OLED driver
- Status display and menus
- Real-time sensor data display

⏳ **SD Card Support**
- Data logging to SD card
- Configuration file storage
- Historical data retrieval

⏳ **Advanced Features**
- Automatic irrigation scheduling
- Sensor calibration
- Over-the-air updates

## Communication Protocol

### Data Packet Format
**Sensor Data (Node → Edge):**
```
DATA,soil1,soil2,soil3,soil4,temperature
```

**Command Format (Edge → Node):**
```
CMD,VALVE,index,action
```
- `index`: Valve number (0-3)
- `action`: "ON" or "OFF"

### Example Commands
```
CMD,VALVE,0,ON    // Open valve 0
CMD,VALVE,1,OFF   // Close valve 1
CMD,VALVE,2,ON    // Open valve 2
```

## System Architecture

### Task Structure
1. **Sensor Task** (`sensor_task`)
   - Reads all sensors every 5 seconds
   - Formats and sends data via LoRa
   - Priority: 5

2. **LoRa Task** (`lora_task`)
   - Handles LoRa communication
   - Processes incoming commands
   - Priority: 5

3. **Valve Control Task** (`valve_control_task`)
   - Manages valve operations
   - Implements safety logic
   - Priority: 5

### Memory Management
- Queue for LoRa commands (10 entries, 256 bytes each)
- Event group for WiFi status
- Dedicated SPI handle for LoRa communication
- ADC handle for sensor readings

## Troubleshooting

### Common Issues

**Build Errors:**
- Ensure ESP-IDF v5.0+ is installed
- Check that all required components are enabled
- Verify GPIO pin assignments don't conflict

**WiFi Connection Issues:**
- Check SSID and password
- Verify WiFi network is available
- Monitor serial output for connection status

**Sensor Reading Issues:**
- Check ADC channel assignments
- Verify sensor connections
- Check power supply to sensors

**LoRa Communication Issues:**
- Verify SPI connections
- Check LoRa module power
- Ensure frequency settings match between nodes

### Debug Commands
```bash
# Monitor serial output
idf.py monitor

# Build with verbose output
idf.py build -v

# Clean build
idf.py clean
```

## Development Notes

### Code Structure
- `main/smart_irrigation_node.c`: Main application code
- `main/node_config.h`: Hardware and system configuration
- `CMakeLists.txt`: Build configuration
- `sdkconfig.defaults`: Default ESP-IDF configuration

### Adding New Features
1. Add function prototypes to the appropriate header
2. Implement functionality in the main C file
3. Update the CMakeLists.txt if new components are needed
4. Test thoroughly with hardware

### Performance Considerations
- ADC readings are done with 12-bit precision
- LoRa communication uses 1 MHz SPI clock
- WiFi is used for diagnostics, not primary communication
- All tasks use appropriate delays to prevent watchdog timeouts

## License

This project is part of the Smart Irrigation System IoT implementation and follows the same license as the parent project.
