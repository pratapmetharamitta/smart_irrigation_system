const express = require('express');
const { query, body, validationResult } = require('express-validator');
const IrrigationEvent = require('../models/IrrigationEvent');
const Device = require('../models/Device');
const auth = require('../middleware/auth');
const mqttService = require('../services/mqttService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/irrigation/{deviceId}/history:
 *   get:
 *     summary: Get irrigation history for a device
 *     tags: [Irrigation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *     responses:
 *       200:
 *         description: Irrigation history
 */
router.get('/:deviceId/history', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
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

    const { limit = 50 } = req.query;
    const history = await IrrigationEvent.getHistoryByDevice(req.params.deviceId, parseInt(limit));

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error('Error fetching irrigation history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/irrigation/{deviceId}/stats:
 *   get:
 *     summary: Get irrigation statistics for a device
 *     tags: [Irrigation]
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
 *     responses:
 *       200:
 *         description: Irrigation statistics
 */
router.get('/:deviceId/stats', [
  auth,
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

    const { startDate, endDate } = req.query;
    let start = null;
    let end = null;

    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);

    const stats = await IrrigationEvent.getStatsForDevice(req.params.deviceId, start, end);

    res.json({
      success: true,
      data: stats.length > 0 ? stats[0] : {
        totalIrrigations: 0,
        message: 'No irrigation events found for the specified period'
      }
    });
  } catch (error) {
    logger.error('Error fetching irrigation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/irrigation/{deviceId}/daily-summary:
 *   get:
 *     summary: Get daily irrigation summary for a device
 *     tags: [Irrigation]
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
 *         description: Daily irrigation summary
 */
router.get('/:deviceId/daily-summary', [
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
    const summary = await IrrigationEvent.getDailySummary(req.params.deviceId, parseInt(days));

    res.json({
      success: true,
      data: summary,
      period: `${days} days`
    });
  } catch (error) {
    logger.error('Error fetching daily irrigation summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @swagger
 * /api/irrigation/{deviceId}/control:
 *   post:
 *     summary: Control irrigation system
 *     tags: [Irrigation]
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
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start, stop, pause, resume]
 *               duration:
 *                 type: number
 *                 minimum: 1
 *                 description: Duration in seconds (required for start action)
 *               reason:
 *                 type: string
 *                 default: manual
 *     responses:
 *       200:
 *         description: Irrigation control command sent successfully
 */
router.post('/:deviceId/control', [
  auth,
  body('action').isIn(['start', 'stop', 'pause', 'resume']).withMessage('Invalid action'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
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

    const { action, duration, reason = 'manual' } = req.body;

    // Validate duration for start action
    if (action === 'start' && !duration) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required for start action'
      });
    }

    // Send irrigation command via MQTT
    const success = mqttService.sendIrrigationCommand(
      req.params.deviceId, 
      action, 
      duration
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send irrigation command - MQTT service unavailable'
      });
    }

    // Create irrigation event record
    const irrigationEvent = new IrrigationEvent({
      deviceId: req.params.deviceId,
      action,
      duration,
      reason,
      triggeredBy: 'user',
      userId: req.user.id
    });

    await irrigationEvent.save();

    // Update device irrigation status
    await Device.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { 
        irrigationStatus: action === 'start' || action === 'resume' ? 'active' : 'inactive',
        lastSeen: new Date()
      }
    );

    logger.info(`Irrigation control command sent: ${action} for device ${req.params.deviceId} by user ${req.user.id}`);

    res.json({
      success: true,
      message: `Irrigation ${action} command sent successfully`,
      data: irrigationEvent
    });
  } catch (error) {
    logger.error('Error sending irrigation control command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
