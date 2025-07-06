# Smart Irrigation System - Makefile
# Simplified build commands for ESP32 development

# Default environment
ENV ?= ttgo-t-sim7000g

# Help target
.PHONY: help
help:
	@echo "🌱 Smart Irrigation System - Build Commands"
	@echo "============================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  setup-toolchain    Setup ESP32 toolchain (macOS)"
	@echo "  setup-env          Setup development environment"
	@echo "  install-deps       Install dependencies"
	@echo ""
	@echo "Build Commands:"
	@echo "  build              Build firmware (ENV=ttgo-t-sim7000g)"
	@echo "  upload             Upload firmware to device"
	@echo "  monitor            Monitor serial output"
	@echo "  clean              Clean build files"
	@echo "  test               Run toolchain test"
	@echo ""
	@echo "Device-Specific Commands:"
	@echo "  build-edge         Build Edge device firmware"
	@echo "  build-node         Build Node device firmware"
	@echo "  build-sensor       Build Sensor node firmware"
	@echo "  build-actuator     Build Actuator node firmware"
	@echo ""
	@echo "Production Commands:"
	@echo "  build-prod-edge    Build production Edge firmware"
	@echo "  build-prod-node    Build production Node firmware"
	@echo "  release            Build all production firmware"
	@echo ""
	@echo "Utility Commands:"
	@echo "  list-ports         List available serial ports"
	@echo "  check-deps         Check dependencies"
	@echo "  format-code        Format code (if clang-format available)"
	@echo ""
	@echo "Examples:"
	@echo "  make build ENV=ttgo-t-sim7000g"
	@echo "  make upload ENV=node-lora"
	@echo "  make monitor ENV=sensor-basic"

# Setup commands
.PHONY: setup-toolchain
setup-toolchain:
	@echo "Setting up ESP32 toolchain..."
	@chmod +x scripts/setup_esp32_toolchain.sh
	@./scripts/setup_esp32_toolchain.sh

.PHONY: setup-env
setup-env:
	@echo "Setting up development environment..."
	@if [ ! -f platformio.ini ]; then echo "❌ platformio.ini not found"; exit 1; fi
	@pio project init --board esp32dev
	@echo "✅ Development environment ready"

.PHONY: install-deps
install-deps:
	@echo "Installing dependencies..."
	@pio pkg install
	@echo "✅ Dependencies installed"

# Build commands
.PHONY: build
build:
	@echo "Building firmware for environment: $(ENV)"
	@pio run -e $(ENV)

.PHONY: upload
upload:
	@echo "Uploading firmware to device: $(ENV)"
	@pio run -e $(ENV) --target upload

.PHONY: monitor
monitor:
	@echo "Monitoring serial output: $(ENV)"
	@pio device monitor --environment $(ENV)

.PHONY: clean
clean:
	@echo "Cleaning build files..."
	@pio run --target clean
	@rm -rf .pio/build

.PHONY: test
test:
	@echo "Running toolchain test..."
	@pio run -e test-basic

# Device-specific builds
.PHONY: build-edge
build-edge:
	@echo "Building Edge device firmware..."
	@pio run -e ttgo-t-sim7000g

.PHONY: build-node
build-node:
	@echo "Building Node device firmware..."
	@pio run -e node-lora

.PHONY: build-sensor
build-sensor:
	@echo "Building Sensor node firmware..."
	@pio run -e sensor-advanced

.PHONY: build-actuator
build-actuator:
	@echo "Building Actuator node firmware..."
	@pio run -e actuator-advanced

# Production builds
.PHONY: build-prod-edge
build-prod-edge:
	@echo "Building production Edge firmware..."
	@pio run -e prod-edge

.PHONY: build-prod-node
build-prod-node:
	@echo "Building production Node firmware..."
	@pio run -e prod-node

.PHONY: release
release: build-prod-edge build-prod-node
	@echo "Creating release artifacts..."
	@mkdir -p release
	@cp .pio/build/prod-edge/firmware.bin release/edge-firmware-$(shell date +%Y%m%d).bin
	@cp .pio/build/prod-node/firmware.bin release/node-firmware-$(shell date +%Y%m%d).bin
	@echo "✅ Release artifacts created in release/"

# Utility commands
.PHONY: list-ports
list-ports:
	@echo "Available serial ports:"
	@if [ "$$(uname)" = "Darwin" ]; then \
		ls -la /dev/cu.* 2>/dev/null || echo "No serial ports found"; \
	elif [ "$$(uname)" = "Linux" ]; then \
		ls -la /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || echo "No serial ports found"; \
	else \
		echo "Unsupported OS for automatic port detection"; \
	fi

.PHONY: check-deps
check-deps:
	@echo "Checking dependencies..."
	@command -v pio >/dev/null 2>&1 || { echo "❌ PlatformIO not found"; exit 1; }
	@pio --version
	@echo "✅ PlatformIO is available"
	@pio pkg list | head -10

.PHONY: format-code
format-code:
	@echo "Formatting code..."
	@if command -v clang-format >/dev/null 2>&1; then \
		find src -name "*.cpp" -o -name "*.h" -o -name "*.ino" | xargs clang-format -i; \
		echo "✅ Code formatted"; \
	else \
		echo "⚠️  clang-format not found, skipping formatting"; \
	fi

# Development helpers
.PHONY: debug
debug:
	@echo "Starting debug session for $(ENV)..."
	@pio run -e $(ENV) --target upload
	@pio device monitor --environment $(ENV) --filter esp32_exception_decoder

.PHONY: flash-erase
flash-erase:
	@echo "Erasing flash memory..."
	@pio run --target erase

.PHONY: size
size:
	@echo "Checking firmware size for $(ENV)..."
	@pio run -e $(ENV) --target size

.PHONY: libs
libs:
	@echo "Available libraries:"
	@pio pkg search --platform espressif32 | head -20

# Continuous Integration helpers
.PHONY: ci-build
ci-build:
	@echo "CI Build - Building all environments..."
	@pio run -e ttgo-t-sim7000g
	@pio run -e node-lora
	@pio run -e sensor-basic
	@pio run -e actuator-basic

.PHONY: ci-test
ci-test:
	@echo "CI Test - Running tests..."
	@pio run -e test-basic
	@echo "✅ All tests passed"

# Docker support
.PHONY: docker-build
docker-build:
	@echo "Building in Docker container..."
	@docker build -t smart-irrigation-build .
	@docker run --rm -v $(PWD):/workspace smart-irrigation-build make ci-build

# Default target
.DEFAULT_GOAL := help
