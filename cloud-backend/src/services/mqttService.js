const mqtt = require('mqtt');
const logger = require('../utils/logger');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const IrrigationEvent = require('../models/IrrigationEvent');

class MQTTService {
  constructor() {
    this.client = null;
    this.io = null;
    this.isConnected = false;
  }

  initialize(io) {
    this.io = io;
    this.connect();
  }

  connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const options = {
      clientId: `smart_irrigation_cloud_${Math.random().toString(16).substr(2, 8)}`,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      keepalive: 60,
      reconnectPeriod: 1000,
      clean: true,
      connectTimeout: 30000,
      will: {
        topic: 'smart_irrigation/cloud/status',
        payload: 'offline',
        qos: 1,
        retain: true
      }
    };

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      logger.info('MQTT Client connected to broker');
      this.isConnected = true;
      
      // Subscribe to device topics
      this.subscribeToTopics();
      
      // Publish online status
      this.client.publish('smart_irrigation/cloud/status', 'online', { retain: true });
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });

    this.client.on('error', (error) => {
      logger.error('MQTT Client error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('MQTT Client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      logger.info('MQTT Client reconnecting...');
    });
  }

  subscribeToTopics() {
    const topics = [
      'smart_irrigation/+/sensor_data',      // Device sensor data
      'smart_irrigation/+/irrigation_status', // Irrigation status updates
      'smart_irrigation/+/device_status',    // Device health/status
      'smart_irrigation/+/alerts',           // Device alerts
      'smart_irrigation/+/node_data'         // Data from LoRa nodes
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          logger.info(`Subscribed to MQTT topic: ${topic}`);
        }
      });
    });
  }

  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const messageType = topicParts[2];

      logger.info(`Received MQTT message: ${topic}`, { deviceId, messageType });

      switch (messageType) {
        case 'sensor_data':
          await this.handleSensorData(deviceId, data);
          break;
        case 'irrigation_status':
          await this.handleIrrigationStatus(deviceId, data);
          break;
        case 'device_status':
          await this.handleDeviceStatus(deviceId, data);
          break;
        case 'alerts':
          await this.handleAlert(deviceId, data);
          break;
        case 'node_data':
          await this.handleNodeData(deviceId, data);
          break;
        default:
          logger.warn(`Unknown message type: ${messageType}`);
      }
    } catch (error) {
      logger.error('Error handling MQTT message:', error);
    }
  }

  async handleSensorData(deviceId, data) {
    try {
      // Create sensor data record
      const sensorData = new SensorData({
        deviceId,
        timestamp: new Date(data.timestamp || Date.now()),
        temperature: data.temperature,
        humidity: data.humidity,
        soilMoisture: data.soil_moisture,
        lightIntensity: data.light_intensity,
        ph: data.ph,
        ec: data.ec,
        batteryLevel: data.battery_level,
        rssi: data.rssi,
        location: data.location
      });

      await sensorData.save();

      // Update device last seen
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          lastSeen: new Date(),
          batteryLevel: data.battery_level,
          rssi: data.rssi
        }
      );

      // Emit to connected clients
      this.io.emit('sensor_data', {
        deviceId,
        data: sensorData
      });

      // Emit to device-specific room
      this.io.to(`device-${deviceId}`).emit('device_sensor_data', sensorData);

      logger.info(`Sensor data saved for device: ${deviceId}`);
    } catch (error) {
      logger.error('Error handling sensor data:', error);
    }
  }

  async handleIrrigationStatus(deviceId, data) {
    try {
      // Create irrigation event record
      const irrigationEvent = new IrrigationEvent({
        deviceId,
        timestamp: new Date(data.timestamp || Date.now()),
        action: data.action, // 'start', 'stop', 'pause'
        duration: data.duration,
        waterAmount: data.water_amount,
        reason: data.reason,
        soilMoistureBefore: data.soil_moisture_before,
        soilMoistureAfter: data.soil_moisture_after
      });

      await irrigationEvent.save();

      // Update device status
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          lastSeen: new Date(),
          irrigationStatus: data.action === 'start' ? 'active' : 'inactive'
        }
      );

      // Emit to connected clients
      this.io.emit('irrigation_status', {
        deviceId,
        data: irrigationEvent
      });

      logger.info(`Irrigation status updated for device: ${deviceId}`);
    } catch (error) {
      logger.error('Error handling irrigation status:', error);
    }
  }

  async handleDeviceStatus(deviceId, data) {
    try {
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          lastSeen: new Date(),
          status: data.status,
          batteryLevel: data.battery_level,
          rssi: data.rssi,
          firmwareVersion: data.firmware_version,
          freeHeap: data.free_heap
        },
        { upsert: true }
      );

      // Emit to connected clients
      this.io.emit('device_status', {
        deviceId,
        data
      });

      logger.info(`Device status updated for device: ${deviceId}`);
    } catch (error) {
      logger.error('Error handling device status:', error);
    }
  }

  async handleAlert(deviceId, data) {
    try {
      // Emit alert to connected clients
      this.io.emit('alert', {
        deviceId,
        alert: data,
        timestamp: new Date()
      });

      logger.warn(`Alert from device ${deviceId}:`, data);
    } catch (error) {
      logger.error('Error handling alert:', error);
    }
  }

  async handleNodeData(deviceId, data) {
    try {
      // Handle data from LoRa nodes (received via Edge device)
      const nodeData = {
        ...data,
        edgeDeviceId: deviceId,
        timestamp: new Date(data.timestamp || Date.now())
      };

      // Save as sensor data with node identifier
      const sensorData = new SensorData({
        deviceId: data.nodeId || `${deviceId}_node`,
        edgeDeviceId: deviceId,
        timestamp: nodeData.timestamp,
        temperature: data.temperature,
        humidity: data.humidity,
        soilMoisture: data.soil_moisture,
        lightIntensity: data.light_intensity,
        batteryLevel: data.battery_level,
        rssi: data.rssi,
        location: data.location
      });

      await sensorData.save();

      // Emit to connected clients
      this.io.emit('node_data', {
        deviceId,
        nodeId: data.nodeId,
        data: sensorData
      });

      logger.info(`Node data saved from device: ${deviceId}, node: ${data.nodeId}`);
    } catch (error) {
      logger.error('Error handling node data:', error);
    }
  }

  // Send command to device
  sendCommand(deviceId, command, payload) {
    if (!this.isConnected) {
      logger.error('MQTT client not connected');
      return false;
    }

    const topic = `smart_irrigation/${deviceId}/commands/${command}`;
    const message = JSON.stringify(payload);

    this.client.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Failed to send command to device ${deviceId}:`, err);
      } else {
        logger.info(`Command sent to device ${deviceId}: ${command}`);
      }
    });

    return true;
  }

  // Send irrigation command
  sendIrrigationCommand(deviceId, action, duration = null) {
    return this.sendCommand(deviceId, 'irrigation', {
      action,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  // Send configuration update
  sendConfigUpdate(deviceId, config) {
    return this.sendCommand(deviceId, 'config', {
      config,
      timestamp: new Date().toISOString()
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      logger.info('MQTT Client disconnected');
    }
  }
}

module.exports = new MQTTService();
