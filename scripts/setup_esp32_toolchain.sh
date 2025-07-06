#!/bin/bash

# ESP32 Toolchain Setup Script for Smart Irrigation System
# This script automates the setup of ESP32 development environment on macOS

set -e

echo "🌱 Smart Irrigation System - ESP32 Toolchain Setup"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please refer to the documentation for other platforms."
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    print_step "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    print_success "Homebrew installed successfully"
else
    print_success "Homebrew is already installed"
fi

# Function to install Arduino IDE
install_arduino_ide() {
    print_step "Installing Arduino IDE..."
    
    if ! command -v arduino-ide &> /dev/null; then
        brew install arduino-ide
        print_success "Arduino IDE installed successfully"
    else
        print_success "Arduino IDE is already installed"
    fi
    
    print_step "Setting up ESP32 board support..."
    echo "Please follow these manual steps in Arduino IDE:"
    echo "1. Open Arduino IDE"
    echo "2. Go to File → Preferences"
    echo "3. Add this URL to 'Additional Boards Manager URLs':"
    echo "   https://dl.espressif.com/dl/package_esp32_index.json"
    echo "4. Go to Tools → Board → Boards Manager"
    echo "5. Search for 'esp32' and install 'esp32 by Espressif Systems'"
    echo ""
    read -p "Press Enter after completing the Arduino IDE setup..."
}

# Function to install VS Code and PlatformIO
install_platformio() {
    print_step "Installing Visual Studio Code..."
    
    if ! command -v code &> /dev/null; then
        brew install visual-studio-code
        print_success "VS Code installed successfully"
    else
        print_success "VS Code is already installed"
    fi
    
    print_step "Installing PlatformIO CLI..."
    
    if ! command -v pio &> /dev/null; then
        # Install Python if not present
        if ! command -v python3 &> /dev/null; then
            brew install python3
        fi
        
        # Install PlatformIO
        pip3 install platformio
        print_success "PlatformIO CLI installed successfully"
    else
        print_success "PlatformIO CLI is already installed"
    fi
    
    print_step "Please install PlatformIO IDE extension in VS Code manually:"
    echo "1. Open VS Code"
    echo "2. Go to Extensions (Ctrl+Shift+X)"
    echo "3. Search for 'PlatformIO IDE'"
    echo "4. Install the extension"
}

# Function to install ESP-IDF
install_esp_idf() {
    print_step "Installing ESP-IDF..."
    
    ESP_IDF_PATH="$HOME/esp/esp-idf"
    
    if [ ! -d "$ESP_IDF_PATH" ]; then
        mkdir -p "$HOME/esp"
        cd "$HOME/esp"
        git clone --recursive https://github.com/espressif/esp-idf.git
        cd esp-idf
        ./install.sh
        print_success "ESP-IDF installed successfully"
    else
        print_success "ESP-IDF is already installed"
    fi
    
    # Add ESP-IDF to shell profile
    SHELL_PROFILE=""
    if [ -f "$HOME/.zshrc" ]; then
        SHELL_PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.bash_profile" ]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    fi
    
    if [ -n "$SHELL_PROFILE" ]; then
        if ! grep -q "esp-idf/export.sh" "$SHELL_PROFILE"; then
            echo "# ESP-IDF" >> "$SHELL_PROFILE"
            echo "alias get_idf='. $HOME/esp/esp-idf/export.sh'" >> "$SHELL_PROFILE"
            print_success "ESP-IDF alias added to $SHELL_PROFILE"
            print_warning "Please run 'source $SHELL_PROFILE' or restart your terminal"
        fi
    fi
}

# Function to install USB drivers
install_usb_drivers() {
    print_step "Installing USB drivers for ESP32 boards..."
    
    # CH340 driver (common on many ESP32 boards)
    if ! brew list --cask wch-ch34x-usb-serial-driver &> /dev/null; then
        brew install --cask wch-ch34x-usb-serial-driver
        print_success "CH340 USB driver installed"
    else
        print_success "CH340 USB driver is already installed"
    fi
    
    # CP2102 driver (Silicon Labs)
    if ! brew list --cask silicon-labs-vcp-driver &> /dev/null; then
        brew install --cask silicon-labs-vcp-driver
        print_success "CP2102 USB driver installed"
    else
        print_success "CP2102 USB driver is already installed"
    fi
}

# Function to create platformio.ini template
create_platformio_config() {
    print_step "Creating PlatformIO configuration template..."
    
    cat > platformio.ini << 'EOF'
; Smart Irrigation System - PlatformIO Configuration
; This file configures the build environment for ESP32 development

[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600
lib_deps = 
    vshymanskyy/TinyGSM@^0.11.7
    bblanchon/ArduinoJson@^6.21.3
    knolleary/PubSubClient@^2.8
    sandeepmistry/LoRa@^0.8.0
    adafruit/Adafruit Unified Sensor@^1.1.9
    adafruit/DHT sensor library@^1.4.4

[env:ttgo-t-sim7000g]
platform = espressif32
board = ttgo-t-sim7000g
framework = arduino
monitor_speed = 115200
upload_speed = 921600
build_flags = 
    -DTTGO_T_SIM7000G
    -DTINY_GSM_MODEM_SIM7000
lib_deps = 
    vshymanskyy/TinyGSM@^0.11.7
    bblanchon/ArduinoJson@^6.21.3
    knolleary/PubSubClient@^2.8
    sandeepmistry/LoRa@^0.8.0
    adafruit/Adafruit Unified Sensor@^1.1.9
    adafruit/DHT sensor library@^1.4.4

[env:node]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 921600
build_flags = 
    -DNODE_DEVICE
lib_deps = 
    sandeepmistry/LoRa@^0.8.0
    adafruit/Adafruit Unified Sensor@^1.1.9
    adafruit/DHT sensor library@^1.4.4
EOF
    
    print_success "PlatformIO configuration created: platformio.ini"
}

# Function to test the setup
test_setup() {
    print_step "Testing the setup..."
    
    # Test if ESP32 tools are available
    if command -v pio &> /dev/null; then
        print_success "PlatformIO CLI is working"
        pio --version
    fi
    
    # Test if drivers are loaded
    if ls /dev/cu.* | grep -q "usb\|wch"; then
        print_success "USB serial devices detected:"
        ls /dev/cu.*usb* /dev/cu.*wch* 2>/dev/null || true
    else
        print_warning "No USB serial devices detected. Connect your ESP32 board to test."
    fi
}

# Main menu
echo ""
echo "Select the toolchain you want to install:"
echo "1. Arduino IDE (Recommended for beginners)"
echo "2. PlatformIO with VS Code (Recommended for professionals)"
echo "3. ESP-IDF (Advanced users)"
echo "4. All toolchains"
echo "5. USB drivers only"
echo "6. Test current setup"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        install_usb_drivers
        install_arduino_ide
        ;;
    2)
        install_usb_drivers
        install_platformio
        create_platformio_config
        ;;
    3)
        install_usb_drivers
        install_esp_idf
        ;;
    4)
        install_usb_drivers
        install_arduino_ide
        install_platformio
        install_esp_idf
        create_platformio_config
        ;;
    5)
        install_usb_drivers
        ;;
    6)
        test_setup
        ;;
    *)
        print_error "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
print_success "Setup completed!"
echo ""
echo "Next steps:"
echo "1. Connect your ESP32 board via USB"
echo "2. Test compilation with one of the example projects"
echo "3. Refer to docs/ESP32_TOOLCHAIN_SETUP.md for detailed instructions"
echo ""
echo "Quick test commands:"
echo "- PlatformIO: pio run"
echo "- ESP-IDF: idf.py build (after running 'get_idf')"
echo ""
echo "Happy coding! 🚀"
