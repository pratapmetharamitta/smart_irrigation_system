const express = require('express');
const { query, validationResult } = require('express-validator');
const SensorData = require('../models/SensorData');
const Device = require('../models/Device');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/sensors/{deviceId}/data:
 *   get:
 *     summary: Get sensor data for a device
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *     responses:
 *       200:
 *         description: Sensor data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorData'
 */
router.get('/:deviceId/data', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId: req.params.deviceId,
      userId: req.user.id 
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const { startDate, endDate, limit = 100 } = req.query;
    let query = { deviceId: req.params.deviceId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const sensorData = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: sensorData,
      count: sensorData.length
    });
  } catch (error) {
    logger.error('Error fetching sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/sensors/{deviceId}/latest:
 *   get:
 *     summary: Get latest sensor data for a device
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest sensor data
 */
router.get('/:deviceId/latest', auth, async (req, res) => {
  try {
    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId: req.params.deviceId,
      userId: req.user.id 
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const latestData = await SensorData.getLatestByDevice(req.params.deviceId);
    
    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data found'
      });
    }

    res.json({
      success: true,
      data: latestData
    });
  } catch (error) {
    logger.error('Error fetching latest sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/sensors/{deviceId}/aggregated:
 *   get:
 *     summary: Get aggregated sensor data for a device
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week]
 *           default: hour
 *     responses:
 *       200:
 *         description: Aggregated sensor data
 */
router.get('/:deviceId/aggregated', [
  auth,
  query('interval').optional().isIn(['hour', 'day', 'week']).withMessage('Invalid interval')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId: req.params.deviceId,
      userId: req.user.id 
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const { interval = 'hour' } = req.query;
    const aggregatedData = await SensorData.getAggregatedData(req.params.deviceId, interval);

    res.json({
      success: true,
      data: aggregatedData,
      interval
    });
  } catch (error) {
    logger.error('Error fetching aggregated sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/sensors/{deviceId}/stats:
 *   get:
 *     summary: Get sensor statistics for a device
 *     tags: [Sensors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *     responses:
 *       200:
 *         description: Sensor statistics
 */
router.get('/:deviceId/stats', [
  auth,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Verify device ownership
    const device = await Device.findOne({ 
      deviceId: req.params.deviceId,
      userId: req.user.id 
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await SensorData.aggregate([
      {
        $match: {
          deviceId: req.params.deviceId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgSoilMoisture: { $avg: '$soilMoisture' },
          avgLightIntensity: { $avg: '$lightIntensity' },
          minTemperature: { $min: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          minHumidity: { $min: '$humidity' },
          maxHumidity: { $max: '$humidity' },
          minSoilMoisture: { $min: '$soilMoisture' },
          maxSoilMoisture: { $max: '$soilMoisture' },
          minLightIntensity: { $min: '$lightIntensity' },
          maxLightIntensity: { $max: '$lightIntensity' },
          firstReading: { $min: '$timestamp' },
          lastReading: { $max: '$timestamp' },
          avgBatteryLevel: { $avg: '$batteryLevel' },
          minBatteryLevel: { $min: '$batteryLevel' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalReadings: 0,
      message: 'No sensor data found for the specified period'
    };

    res.json({
      success: true,
      data: result,
      period: `${days} days`
    });
  } catch (error) {
    logger.error('Error fetching sensor statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/sensors/data:
 *   post:
 *     summary: Receive sensor data from edge devices (webhook endpoint)
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - timestamp
 *             properties:
 *               deviceId:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               temperature:
 *                 type: number
 *               humidity:
 *                 type: number
 *               soilMoisture:
 *                 type: number
 *               lightIntensity:
 *                 type: number
 *               ph:
 *                 type: number
 *               ec:
 *                 type: number
 *               batteryLevel:
 *                 type: number
 *               rssi:
 *                 type: number
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       200:
 *         description: Data received successfully
 *       400:
 *         description: Invalid data format
 */
router.post('/data', async (req, res) => {
  try {
    const { deviceId, timestamp, ...sensorReadings } = req.body;

    if (!deviceId || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and timestamp are required'
      });
    }

    // Verify device exists
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Create sensor data record
    const sensorData = new SensorData({
      deviceId,
      timestamp: new Date(timestamp),
      ...sensorReadings
    });

    await sensorData.save();

    // Update device status
    await device.updateStatus('online', {
      batteryLevel: sensorReadings.batteryLevel,
      rssi: sensorReadings.rssi
    });

    // Emit to connected clients via WebSocket
    const io = req.app.get('io');
    io.emit('sensor_data', {
      deviceId,
      data: sensorData
    });

    logger.info(`Sensor data received via HTTP: ${deviceId}`);

    res.json({
      success: true,
      message: 'Sensor data received successfully',
      id: sensorData._id
    });
  } catch (error) {
    logger.error('Error receiving sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
