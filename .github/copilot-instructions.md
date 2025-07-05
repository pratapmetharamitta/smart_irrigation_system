# Smart Irrigation System - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive Smart Irrigation System IoT project with the following components:
- **Edge Devices**: ESP32/Arduino-based sensors and controllers
- **Cloud Backend**: Node.js/Express API with database integration
- **Mobile App**: React Native cross-platform mobile application
- **Documentation**: Project setup, API docs, and user guides

## Development Guidelines

### General Rules
- Use modern JavaScript/TypeScript with async/await patterns
- Follow IoT best practices for device communication and data handling
- Implement proper error handling and logging throughout the system
- Use environment variables for configuration management
- Follow security best practices for IoT deployments

### Edge Devices (Arduino/ESP32)
- Write clean, efficient C++ code for microcontrollers
- Use proper sensor libraries and communication protocols
- Implement power management for battery-operated devices
- Handle network connectivity issues gracefully
- Use JSON for data exchange with cloud services

### Cloud Backend
- Use Express.js with proper middleware structure
- Implement RESTful API design principles
- Use MongoDB or PostgreSQL for data persistence
- Implement proper authentication and authorization
- Add comprehensive logging and monitoring
- Use Docker for containerization

### Mobile App
- Use React Native with TypeScript
- Implement proper state management (Redux/Context API)
- Create responsive UI components
- Handle offline scenarios and data synchronization
- Use proper navigation patterns
- Implement push notifications for alerts

### Code Quality
- Write comprehensive tests for all components
- Use ESLint and Prettier for code formatting
- Follow semantic versioning for releases
- Document APIs using OpenAPI/Swagger
- Use Git flow for version control

## Architecture Notes
- Edge devices communicate with cloud via MQTT/HTTP
- Real-time data visualization using WebSockets
- Mobile app syncs with cloud backend via REST API
- Database stores sensor data, device configurations, and user settings
- Cloud services handle device management and analytics
