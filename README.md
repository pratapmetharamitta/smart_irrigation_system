# Smart Irrigation System

A comprehensive IoT-based smart irrigation system for automated watering and monitoring.

## 🌱 Overview

This project implements a complete smart irrigation solution with:
- Edge devices for sensor monitoring
- LoRa mesh networking for remote device communication
- Cloud backend for data management
- Mobile app for remote control
- Real-time analytics and automation

## 🚀 Status

**Current Phase**: Development environment setup with comprehensive CI/CD pipeline

## 🏗️ Architecture

```
Edge Devices ↔ LoRa Network ↔ Gateway ↔ Cloud Backend ↔ Mobile App
     ↓            ↓            ↓         ↓              ↓
   Sensors    433/868/915MHz  TTGO      REST API    React Native
     ↓            ↓            ↓         ↓              ↓
  Moisture      Long Range    WiFi   PostgreSQL    iOS/Android
```

## 📝 Development Log

- [x] Project initialization
- [x] .gitignore setup
- [x] README creation
- [x] GitHub repository setup ✅
- [x] Git authentication configured
- [x] CI/CD pipeline ✅
  - [x] GitHub Actions workflows
  - [x] Docker containerization
  - [x] Development environment
  - [x] Testing automation
  - [x] Security scanning
  - [x] Deployment automation
- [ ] Edge device development
- [ ] Cloud backend API
- [ ] Mobile app development

## 🛠️ Development Environment

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/smart_irrigation_system.git
cd smart_irrigation_system

# Start development environment
./dev.sh start

# View service logs
./dev.sh logs

# Run tests
./dev.sh test

# Stop environment
./dev.sh stop
```

### Services Available

- **Backend API**: http://localhost:3000
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **InfluxDB**: http://localhost:8086
- **Node-RED**: http://localhost:1880
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MQTT Broker**: localhost:1883

### CI/CD Pipeline

The project includes comprehensive GitHub Actions workflows:

- **Main CI/CD** (`.github/workflows/ci-cd.yml`)
  - Edge device validation
  - Backend testing and building
  - Mobile app testing
  - Security scanning
  - Docker image building

- **Testing** (`.github/workflows/testing.yml`)
  - Unit tests
  - Integration tests
  - End-to-end tests
  - Performance tests
  - Security tests

- **Deployment** (`.github/workflows/deployment.yml`)
  - Environment-specific deployments
  - Smoke tests
  - Rollback capabilities

- **Monitoring** (`.github/workflows/monitoring.yml`)
  - Health checks
  - Performance monitoring
  - Alerting
  - Resource cleanup

### Development Commands

```bash
# Setup development environment
./dev.sh setup

# Start all services
./dev.sh start

# Check service health
./dev.sh status

# View logs
./dev.sh logs

# Run tests
./dev.sh test

# Deploy to staging
./dev.sh deploy

# Clean up environment
./dev.sh cleanup
```

## 📡 LoRa Network Component

The `Node/` directory contains TTGO LoRa series board implementations for long-range wireless communication:

### Features
- **Multi-frequency support**: 433MHz, 868MHz, 915MHz
- **Multiple board versions**: V1.0, V1.2, V1.6, V2.0
- **OLED display integration**: Real-time status monitoring
- **SD card support**: Data logging capabilities
- **WiFi connectivity**: Gateway functionality
- **Sensor integration**: Soil moisture, temperature monitoring

### Board Compatibility
- TTGO LoRa V1.0 (with 3D WiFi antenna for 868MHz, PCB antenna for 433MHz)
- TTGO LoRa V1.2 (T-Fox variant)
- TTGO LoRa V1.6 (with SD card support)
- TTGO LoRa V2.0 (latest version)

### Setup Instructions
1. Configure board version in `Node/LoRa/board_def.h`
2. Set frequency band (433/868/915MHz)
3. Configure as sender or receiver mode
4. Install required libraries:
   - [arduino-LoRa](https://github.com/sandeepmistry/arduino-LoRa)
   - [oled-ssd1306](https://github.com/ThingPulse/esp8266-oled-ssd1306)

### Applications
- **Remote sensors**: Soil moisture, temperature monitoring
- **Valve control**: Remote irrigation system control
- **Data gateway**: LoRa to WiFi bridge
- **Mesh networking**: Extended range coverage

---

**Version**: 1.0.0-alpha  
**Last Updated**: July 5, 2025