const express = require('express');
const { body, validationResult } = require('express-validator');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const IrrigationEvent = require('../models/IrrigationEvent');
const mqttService = require('../services/mqttService');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices for the authenticated user
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of devices
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
 *                     $ref: '#/components/schemas/Device'
 */
router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.id })
      .sort({ lastSeen: -1 });
    
    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
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
 *         description: Device details
 *       404:
 *         description: Device not found
 */
router.get('/:deviceId', auth, async (req, res) => {
  try {
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

    // Get latest sensor data
    const latestSensorData = await SensorData.getLatestByDevice(req.params.deviceId);
    
    res.json({
      success: true,
      data: {
        ...device.toObject(),
        latestSensorData
      }
    });
  } catch (error) {
    logger.error('Error fetching device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Register a new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - name
 *               - type
 *             properties:
 *               deviceId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [edge_device, lora_node, sensor_node]
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 */
router.post('/', [
  auth,
  body('deviceId').notEmpty().trim().withMessage('Device ID is required'),
  body('name').notEmpty().trim().withMessage('Device name is required'),
  body('type').isIn(['edge_device', 'lora_node', 'sensor_node']).withMessage('Invalid device type')
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

    const { deviceId, name, type, location } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: 'Device already exists'
      });
    }

    const device = new Device({
      deviceId,
      name,
      type,
      location,
      userId: req.user.id
    });

    await device.save();

    logger.info(`New device registered: ${deviceId} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    logger.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   put:
 *     summary: Update device configuration
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: object
 *               configuration:
 *                 type: object
 */
router.put('/:deviceId', auth, async (req, res) => {
  try {
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

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.location) updateData.location = req.body.location;
    if (req.body.configuration) updateData.configuration = req.body.configuration;

    Object.assign(device, updateData);
    await device.save();

    // Send configuration update to device via MQTT
    if (req.body.configuration) {
      mqttService.sendConfigUpdate(req.params.deviceId, req.body.configuration);
    }

    logger.info(`Device updated: ${req.params.deviceId}`);

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    logger.error('Error updating device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}:
 *   delete:
 *     summary: Delete device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:deviceId', auth, async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({ 
      deviceId: req.params.deviceId,
      userId: req.user.id 
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Clean up related data
    await SensorData.deleteMany({ deviceId: req.params.deviceId });
    await IrrigationEvent.deleteMany({ deviceId: req.params.deviceId });

    logger.info(`Device deleted: ${req.params.deviceId}`);

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/devices/{deviceId}/irrigate:
 *   post:
 *     summary: Start irrigation for a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start, stop, pause, resume]
 *               duration:
 *                 type: number
 *                 description: Duration in seconds
 */
router.post('/:deviceId/irrigate', [
  auth,
  body('action').isIn(['start', 'stop', 'pause', 'resume']).withMessage('Invalid action'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer')
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

    const { action, duration } = req.body;

    // Send irrigation command via MQTT
    const success = mqttService.sendIrrigationCommand(
      req.params.deviceId, 
      action, 
      duration
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send irrigation command'
      });
    }

    // Create irrigation event record
    const irrigationEvent = new IrrigationEvent({
      deviceId: req.params.deviceId,
      action,
      duration,
      reason: 'manual',
      triggeredBy: 'user',
      userId: req.user.id
    });

    await irrigationEvent.save();

    logger.info(`Irrigation command sent: ${action} for device ${req.params.deviceId}`);

    res.json({
      success: true,
      message: `Irrigation ${action} command sent successfully`,
      data: irrigationEvent
    });
  } catch (error) {
    logger.error('Error sending irrigation command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
