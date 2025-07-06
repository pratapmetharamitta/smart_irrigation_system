# Smart Irrigation System - Cloud Backend

A comprehensive Node.js backend for the Smart Irrigation System IoT platform, designed to handle data from Edge devices communicating via 4G-LTE/5G-LTE networks.

## Features

### Core Functionality
- **RESTful API** for device management and data retrieval
- **MQTT Integration** for real-time device communication
- **WebSocket Support** for real-time dashboard updates
- **MongoDB Database** for persistent data storage
- **JWT Authentication** for secure API access
- **Device Management** with registration and configuration
- **Sensor Data Processing** with aggregation and analytics
- **Irrigation Control** with manual and automated triggers
- **Alert System** for device monitoring and anomaly detection

### IoT Communication
- **4G/5G-LTE Support** for Edge device connectivity
- **MQTT Broker Integration** for bi-directional communication
- **HTTP Webhooks** for device data ingestion
- **Real-time Data Streaming** via WebSockets
- **Command & Control** for remote device management

### Data Management
- **Time-series Data Storage** for sensor readings
- **Data Aggregation** (hourly, daily, weekly views)
- **Historical Data Analysis** with statistics and trends
- **Device Status Tracking** with online/offline monitoring
- **Irrigation Event Logging** with water usage tracking

### Security & Performance
- **JWT Authentication** with role-based access control
- **Rate Limiting** to prevent API abuse
- **Input Validation** and sanitization
- **Error Handling** with comprehensive logging
- **Docker Support** for containerized deployment
- **Environment-based Configuration** for different deployments

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Edge Device   │    │   Cloud Backend │    │   Mobile App    │
│   (ESP32 + LTE) │◄──►│   (Node.js)     │◄──►│ (React Native)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    LoRa Network              MongoDB                WebSocket
         │                   Database                Connection
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LoRa Node     │    │   MQTT Broker   │    │   Dashboard     │
│   (Sensors)     │    │   (Messages)    │    │   (Real-time)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- MQTT Broker (Mosquitto recommended)
- Redis (optional, for caching)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart_irrigation_system/cloud-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB
   mongod --config /usr/local/etc/mongod.conf
   
   # Start Redis (optional)
   redis-server
   ```

5. **MQTT Broker Setup**
   ```bash
   # Install Mosquitto
   brew install mosquitto  # macOS
   # or
   sudo apt-get install mosquitto mosquitto-clients  # Ubuntu
   
   # Start Mosquitto
   mosquitto -c /usr/local/etc/mosquitto/mosquitto.conf
   ```

6. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smart_irrigation` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |
| `MQTT_BROKER_URL` | MQTT broker URL | `mqtt://localhost:1883` |
| `MQTT_USERNAME` | MQTT username | (empty) |
| `MQTT_PASSWORD` | MQTT password | (empty) |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

### Database Configuration

The backend uses MongoDB with the following collections:
- `users` - User accounts and authentication
- `devices` - Registered IoT devices
- `sensordatas` - Time-series sensor readings
- `irrigationevents` - Irrigation activity logs

### MQTT Topics

| Topic Pattern | Description | Direction |
|---------------|-------------|-----------|
| `smart_irrigation/{deviceId}/sensor_data` | Sensor readings | Device → Cloud |
| `smart_irrigation/{deviceId}/irrigation_status` | Irrigation events | Device → Cloud |
| `smart_irrigation/{deviceId}/device_status` | Device health | Device → Cloud |
| `smart_irrigation/{deviceId}/alerts` | Device alerts | Device → Cloud |
| `smart_irrigation/{deviceId}/node_data` | LoRa node data | Device → Cloud |
| `smart_irrigation/{deviceId}/commands/{command}` | Device commands | Cloud → Device |

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update user profile |
| PUT | `/api/auth/change-password` | Change password |

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/devices` | List user devices |
| POST | `/api/devices` | Register new device |
| GET | `/api/devices/{deviceId}` | Get device details |
| PUT | `/api/devices/{deviceId}` | Update device |
| DELETE | `/api/devices/{deviceId}` | Delete device |
| POST | `/api/devices/{deviceId}/irrigate` | Control irrigation |

### Sensor Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sensors/{deviceId}/data` | Get sensor data |
| GET | `/api/sensors/{deviceId}/latest` | Get latest reading |
| GET | `/api/sensors/{deviceId}/aggregated` | Get aggregated data |
| GET | `/api/sensors/{deviceId}/stats` | Get sensor statistics |
| POST | `/api/sensors/data` | Receive sensor data (webhook) |

### Irrigation Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/irrigation/{deviceId}/history` | Get irrigation history |
| GET | `/api/irrigation/{deviceId}/stats` | Get irrigation statistics |
| GET | `/api/irrigation/{deviceId}/daily-summary` | Get daily summary |
| POST | `/api/irrigation/{deviceId}/control` | Control irrigation |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Get dashboard overview |
| GET | `/api/dashboard/devices` | Get device summaries |
| GET | `/api/dashboard/alerts` | Get current alerts |

### API Documentation
- **Swagger UI**: `http://localhost:3000/api-docs` (development mode)
- **Health Check**: `http://localhost:3000/health`

## WebSocket Events

### Client → Server
- `join-device` - Join device-specific room

### Server → Client
- `sensor_data` - New sensor data received
- `device_sensor_data` - Device-specific sensor data
- `irrigation_status` - Irrigation status update
- `device_status` - Device status change
- `alert` - Device alert/notification
- `node_data` - LoRa node data

## Data Models

### Device
```javascript
{
  deviceId: String,      // Unique device identifier
  name: String,          // Human-readable name
  type: String,          // 'edge_device', 'lora_node', 'sensor_node'
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: String,        // 'online', 'offline', 'maintenance', 'error'
  irrigationStatus: String, // 'active', 'inactive', 'scheduled', 'error'
  batteryLevel: Number,  // 0-100
  rssi: Number,          // Signal strength
  configuration: Object, // Device-specific settings
  lastSeen: Date,        // Last communication
  userId: ObjectId       // Owner reference
}
```

### Sensor Data
```javascript
{
  deviceId: String,      // Device identifier
  timestamp: Date,       // Reading timestamp
  temperature: Number,   // °C
  humidity: Number,      // %
  soilMoisture: Number,  // %
  lightIntensity: Number, // lux
  ph: Number,           // pH value
  ec: Number,           // Electrical conductivity
  batteryLevel: Number, // %
  rssi: Number,         // Signal strength
  location: {
    latitude: Number,
    longitude: Number
  }
}
```

### Irrigation Event
```javascript
{
  deviceId: String,      // Device identifier
  timestamp: Date,       // Event timestamp
  action: String,        // 'start', 'stop', 'pause', 'resume'
  duration: Number,      // Seconds
  waterAmount: Number,   // Liters
  reason: String,        // 'scheduled', 'manual', 'sensor_triggered'
  triggeredBy: String,   // 'user', 'system', 'sensor'
  soilMoistureBefore: Number,
  soilMoistureAfter: Number,
  userId: ObjectId
}
```

## Deployment

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t smart-irrigation-backend .
   ```

2. **Run with Docker Compose**
   ```yaml
   version: '3.8'
   services:
     backend:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/smart_irrigation
         - MQTT_BROKER_URL=mqtt://mosquitto:1883
       depends_on:
         - mongo
         - mosquitto
     
     mongo:
       image: mongo:5.0
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db
     
     mosquitto:
       image: eclipse-mosquitto:2
       ports:
         - "1883:1883"
         - "9001:9001"
       volumes:
         - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
   
   volumes:
     mongodb_data:
   ```

### Production Deployment

1. **Environment Setup**
   - Set secure JWT secret
   - Configure production database
   - Set up SSL/TLS certificates
   - Configure reverse proxy (Nginx)

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/server.js --name smart-irrigation-backend
   ```

3. **Monitoring**
   - Enable production logging
   - Set up health checks
   - Configure monitoring dashboards
   - Set up alerts and notifications

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Linting
```bash
# Check code style
npm run lint

# Fix linting issues
npm run lint:fix
```

### API Documentation
```bash
# Generate API documentation
npm run build:docs
```

## Edge Device Integration

### HTTP Webhook Integration
Edge devices can send data via HTTP POST to `/api/sensors/data`:

```json
{
  "deviceId": "ESP32_001",
  "timestamp": "2025-01-01T12:00:00Z",
  "temperature": 25.5,
  "humidity": 60.2,
  "soilMoisture": 35.8,
  "lightIntensity": 1200,
  "batteryLevel": 85,
  "rssi": -65,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

### MQTT Integration
Edge devices can publish data to MQTT topics:

```javascript
// ESP32 MQTT client example
const payload = {
  "timestamp": "2025-01-01T12:00:00Z",
  "temperature": 25.5,
  "humidity": 60.2,
  "soil_moisture": 35.8,
  "light_intensity": 1200,
  "battery_level": 85,
  "rssi": -65
};

client.publish("smart_irrigation/ESP32_001/sensor_data", JSON.stringify(payload));
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB service status
   - Verify connection string
   - Check network connectivity

2. **MQTT Connection Issues**
   - Verify broker is running
   - Check broker URL and credentials
   - Test with MQTT client tools

3. **Device Not Receiving Commands**
   - Check device is subscribed to command topics
   - Verify MQTT connection is active
   - Check device-specific logs

4. **High Memory Usage**
   - Monitor sensor data collection
   - Implement data retention policies
   - Consider database indexing

### Logging

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output in development mode

### Performance Optimization

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Implement data aggregation pipelines
   - Set up data retention policies

2. **API Performance**
   - Implement response caching
   - Use pagination for large datasets
   - Optimize database queries

3. **Real-time Performance**
   - Monitor WebSocket connections
   - Implement connection pooling
   - Use Redis for session management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation
- Monitor logs for error details
