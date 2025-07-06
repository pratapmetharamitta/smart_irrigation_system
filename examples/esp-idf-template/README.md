# Smart Irrigation System - ESP-IDF Project Template

This directory contains an ESP-IDF project template for the Smart Irrigation System Edge devices.

## Quick Start

1. **Setup ESP-IDF environment**:
   ```bash
   # Run the setup script
   ./scripts/setup_esp32_env.sh
   
   # Or manually activate ESP-IDF
   get_idf
   ```

2. **Copy this template to your project directory**:
   ```bash
   cp -r examples/esp-idf-template ~/my_smart_irrigation_project
   cd ~/my_smart_irrigation_project
   ```

3. **Configure the project**:
   ```bash
   idf.py menuconfig
   ```

4. **Build and flash**:
   ```bash
   idf.py build flash monitor
   ```

## Project Structure

```
esp-idf-template/
├── CMakeLists.txt                  # Main CMake configuration
├── main/
│   ├── CMakeLists.txt             # Main component CMake
│   ├── main.c                     # Main application entry point
│   ├── board_config.h             # Hardware pin definitions
│   ├── app_config.h               # Application configuration
│   └── Kconfig.projbuild          # Project configuration menu
├── components/
│   ├── EdgeLoRa/                  # LoRa communication component
│   │   ├── CMakeLists.txt
│   │   ├── include/EdgeLoRa.h
│   │   └── EdgeLoRa.c
│   ├── EdgeCellular/              # Cellular communication component
│   │   ├── CMakeLists.txt
│   │   ├── include/EdgeCellular.h
│   │   └── EdgeCellular.c
│   └── Sensors/                   # Sensor reading component
│       ├── CMakeLists.txt
│       ├── include/Sensors.h
│       └── Sensors.c
├── partitions.csv                 # Flash partition table
├── sdkconfig.defaults             # Default SDK configuration
└── README.md                      # This file
```

## Key Features

- **Modular Architecture**: Separate components for LoRa, cellular, and sensors
- **Hardware Abstraction**: Board-specific pin definitions
- **Configuration Management**: Centralized configuration with Kconfig
- **Production Ready**: Includes partition table and default configurations
- **Extensible**: Easy to add new components and features

## Configuration Options

The project includes custom configuration options accessible via `idf.py menuconfig`:

- **Smart Irrigation Configuration**
  - Sensor reading intervals
  - LoRa communication parameters
  - Cellular connection settings
  - Power management options

## Development Workflow

1. **Modify main application**: Edit `main/main.c`
2. **Add new components**: Create new directories in `components/`
3. **Configure hardware**: Update `main/board_config.h`
4. **Adjust settings**: Run `idf.py menuconfig`
5. **Build and test**: Use `idf.py build flash monitor`

## Hardware Support

This template is configured for:
- **Primary Board**: T-SIM7000G (ESP32 + SIM7000G cellular modem)
- **LoRa Communication**: Shield LoRa attached to T-SIM7000G
- **Alternative Boards**: Any ESP32 board with appropriate pin configuration

## Next Steps

1. Customize `main/board_config.h` for your hardware
2. Implement sensor reading logic in `components/Sensors/`
3. Configure LoRa parameters in `components/EdgeLoRa/`
4. Set up cellular connection in `components/EdgeCellular/`
5. Add your application logic to `main/main.c`

For more detailed information, see the main project documentation in `docs/ESP32_TOOLCHAIN_SETUP.md`.
