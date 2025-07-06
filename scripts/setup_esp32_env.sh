#!/bin/bash
# ESP32 Development Environment Setup Script for Smart Irrigation System
# This script sets up ESP-IDF development environment on macOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌱 Smart Irrigation System - ESP32 Development Environment Setup${NC}"
echo "================================================================="

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script is designed for macOS. Please follow manual installation instructions.${NC}"
    exit 1
fi

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew is not installed. Please install Homebrew first:${NC}"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo -e "${YELLOW}📦 Installing required dependencies...${NC}"

# Install required tools
echo "Installing cmake, ninja, dfu-util, python3, git..."
brew install cmake ninja dfu-util python3 git

echo -e "${YELLOW}🔌 Installing USB drivers...${NC}"

# Install USB drivers for ESP32 boards
brew install homebrew/cask-drivers/wch-ch34x-usb-serial-driver || true

echo -e "${YELLOW}📁 Setting up ESP-IDF...${NC}"

# Create ESP directory
ESP_DIR="$HOME/esp"
mkdir -p "$ESP_DIR"
cd "$ESP_DIR"

# Clone ESP-IDF if not exists
if [ ! -d "esp-idf" ]; then
    echo "Cloning ESP-IDF repository..."
    git clone --recursive https://github.com/espressif/esp-idf.git
else
    echo "ESP-IDF already exists, updating..."
    cd esp-idf
    git fetch origin
    cd ..
fi

cd esp-idf

# Checkout stable version
echo "Checking out ESP-IDF v5.1.2..."
git checkout v5.1.2
git submodule update --init --recursive

# Install ESP-IDF tools
echo -e "${YELLOW}🛠️  Installing ESP-IDF tools...${NC}"
./install.sh esp32

# Add alias to shell profile
SHELL_PROFILE=""
if [[ "$SHELL" == */zsh ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ "$SHELL" == */bash ]]; then
    SHELL_PROFILE="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_PROFILE" ]]; then
    echo -e "${YELLOW}🔧 Adding ESP-IDF alias to $SHELL_PROFILE...${NC}"
    
    # Check if alias already exists
    if ! grep -q "alias get_idf" "$SHELL_PROFILE" 2>/dev/null; then
        echo "" >> "$SHELL_PROFILE"
        echo "# ESP-IDF alias for Smart Irrigation System" >> "$SHELL_PROFILE"
        echo "alias get_idf=\". $ESP_DIR/esp-idf/export.sh\"" >> "$SHELL_PROFILE"
        echo "Added ESP-IDF alias to $SHELL_PROFILE"
    else
        echo "ESP-IDF alias already exists in $SHELL_PROFILE"
    fi
fi

echo -e "${GREEN}✅ ESP-IDF setup complete!${NC}"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your terminal or run: source $SHELL_PROFILE"
echo "2. Activate ESP-IDF environment: get_idf"
echo "3. Create a new project: idf.py create-project my_project"
echo "4. Configure project: idf.py menuconfig"
echo "5. Build and flash: idf.py build flash monitor"
echo ""
echo "📚 Documentation: https://docs.espressif.com/projects/esp-idf/en/latest/"
echo "🔧 Project-specific firmware: Edge/EdgeEnhanced.ino (convert to ESP-IDF)"
echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"

# Test if ESP-IDF can be sourced
echo -e "${YELLOW}🧪 Testing ESP-IDF installation...${NC}"
source "$ESP_DIR/esp-idf/export.sh"

if command -v idf.py &> /dev/null; then
    echo -e "${GREEN}✅ ESP-IDF installation test passed!${NC}"
    echo "ESP-IDF version: $(idf.py --version)"
else
    echo -e "${RED}❌ ESP-IDF installation test failed. Please check the installation.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🌱 Smart Irrigation System ESP32 environment is ready!${NC}"
