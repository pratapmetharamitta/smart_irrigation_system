const express = require('express');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const IrrigationEvent = require('../models/IrrigationEvent');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get('/overview', auth, async (req, res) => {
  try {
    // Get user's devices
    const devices = await Device.find({ userId: req.user.id });
    const deviceIds = devices.map(d => d.deviceId);

    // Get device counts by status
    const deviceStats = await Device.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get latest sensor data for each device
    const latestSensorData = await Promise.all(
      deviceIds.map(async (deviceId) => {
        const data = await SensorData.getLatestByDevice(deviceId);
        return data;
      })
    );

    // Get irrigation stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const irrigationStats = await IrrigationEvent.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalIrrigations: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalWaterUsed: { $sum: '$waterAmount' }
        }
      }
    ]);

    // Get recent alerts (devices offline for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const offlineDevices = devices.filter(device => device.lastSeen < oneHourAgo);

    // Calculate average sensor values
    const validSensorData = latestSensorData.filter(data => data !== null);
    const avgSensorValues = validSensorData.length > 0 ? {
      temperature: validSensorData.reduce((sum, data) => sum + (data.temperature || 0), 0) / validSensorData.length,
      humidity: validSensorData.reduce((sum, data) => sum + (data.humidity || 0), 0) / validSensorData.length,
      soilMoisture: validSensorData.reduce((sum, data) => sum + (data.soilMoisture || 0), 0) / validSensorData.length,
      batteryLevel: validSensorData.reduce((sum, data) => sum + (data.batteryLevel || 0), 0) / validSensorData.length
    } : null;

    res.json({
      success: true,
      data: {
        deviceCount: devices.length,
        deviceStats: deviceStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        irrigationStats: irrigationStats.length > 0 ? irrigationStats[0] : {
          totalIrrigations: 0,
          totalDuration: 0,
          totalWaterUsed: 0
        },
        averageSensorValues: avgSensorValues,
        alerts: {
          offlineDevices: offlineDevices.length,
          lowBatteryDevices: devices.filter(d => d.batteryLevel && d.batteryLevel < 20).length
        },
        recentActivity: {
          lastDataUpdate: validSensorData.length > 0 ? 
            Math.max(...validSensorData.map(d => new Date(d.timestamp).getTime())) : null,
          activeIrrigations: devices.filter(d => d.irrigationStatus === 'active').length
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/dashboard/devices:
 *   get:
 *     summary: Get dashboard device summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device summary for dashboard
 */
router.get('/devices', auth, async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.id }).sort({ lastSeen: -1 });
    
    // Get latest sensor data for each device
    const deviceSummaries = await Promise.all(
      devices.map(async (device) => {
        const latestSensorData = await SensorData.getLatestByDevice(device.deviceId);
        const isOnline = device.lastSeen > new Date(Date.now() - 5 * 60 * 1000); // 5 minutes
        
        return {
          deviceId: device.deviceId,
          name: device.name,
          type: device.type,
          status: device.status,
          isOnline,
          irrigationStatus: device.irrigationStatus,
          batteryLevel: device.batteryLevel,
          rssi: device.rssi,
          lastSeen: device.lastSeen,
          location: device.location,
          latestSensorData: latestSensorData ? {
            temperature: latestSensorData.temperature,
            humidity: latestSensorData.humidity,
            soilMoisture: latestSensorData.soilMoisture,
            lightIntensity: latestSensorData.lightIntensity,
            timestamp: latestSensorData.timestamp
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: deviceSummaries
    });
  } catch (error) {
    logger.error('Error fetching device summaries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     summary: Get dashboard alerts
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current alerts
 */
router.get('/alerts', auth, async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.id });
    const alerts = [];

    // Check for offline devices (no data for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const offlineDevices = devices.filter(device => device.lastSeen < oneHourAgo);
    
    offlineDevices.forEach(device => {
      alerts.push({
        type: 'device_offline',
        severity: 'warning',
        deviceId: device.deviceId,
        deviceName: device.name,
        message: `Device ${device.name} has been offline for more than 1 hour`,
        timestamp: new Date(),
        lastSeen: device.lastSeen
      });
    });

    // Check for low battery devices
    const lowBatteryDevices = devices.filter(d => d.batteryLevel && d.batteryLevel < 20);
    lowBatteryDevices.forEach(device => {
      alerts.push({
        type: 'low_battery',
        severity: device.batteryLevel < 10 ? 'critical' : 'warning',
        deviceId: device.deviceId,
        deviceName: device.name,
        message: `Device ${device.name} has low battery: ${device.batteryLevel}%`,
        timestamp: new Date(),
        batteryLevel: device.batteryLevel
      });
    });

    // Check for sensor anomalies (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    for (const device of devices) {
      const recentData = await SensorData.find({
        deviceId: device.deviceId,
        timestamp: { $gte: yesterday }
      }).sort({ timestamp: -1 }).limit(10);

      if (recentData.length > 0) {
        const latestData = recentData[0];
        
        // Check for extreme values
        if (latestData.temperature && (latestData.temperature > 50 || latestData.temperature < -10)) {
          alerts.push({
            type: 'temperature_anomaly',
            severity: 'warning',
            deviceId: device.deviceId,
            deviceName: device.name,
            message: `Extreme temperature reading: ${latestData.temperature}°C`,
            timestamp: latestData.timestamp,
            value: latestData.temperature
          });
        }

        if (latestData.soilMoisture && latestData.soilMoisture < 10) {
          alerts.push({
            type: 'low_soil_moisture',
            severity: 'info',
            deviceId: device.deviceId,
            deviceName: device.name,
            message: `Low soil moisture detected: ${latestData.soilMoisture}%`,
            timestamp: latestData.timestamp,
            value: latestData.soilMoisture
          });
        }
      }
    }

    // Sort alerts by severity and timestamp
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      success: true,
      data: alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
