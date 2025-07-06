const mongoose = require('mongoose');

const irrigationEventSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  action: {
    type: String,
    enum: ['start', 'stop', 'pause', 'resume', 'schedule'],
    required: true
  },
  duration: {
    type: Number, // Duration in seconds
    min: 0
  },
  waterAmount: {
    type: Number, // Amount in liters
    min: 0
  },
  reason: {
    type: String,
    enum: ['scheduled', 'manual', 'sensor_triggered', 'emergency', 'maintenance'],
    required: true
  },
  soilMoistureBefore: {
    type: Number,
    min: 0,
    max: 100
  },
  soilMoistureAfter: {
    type: Number,
    min: 0,
    max: 100
  },
  triggeredBy: {
    type: String,
    enum: ['user', 'system', 'sensor', 'schedule'],
    default: 'system'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
irrigationEventSchema.index({ deviceId: 1, timestamp: -1 });
irrigationEventSchema.index({ timestamp: -1 });
irrigationEventSchema.index({ action: 1 });
irrigationEventSchema.index({ reason: 1 });

// Static method to get irrigation history
irrigationEventSchema.statics.getHistoryByDevice = function(deviceId, limit = 50) {
  return this.find({ deviceId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get irrigation stats
irrigationEventSchema.statics.getStatsForDevice = function(deviceId, startDate, endDate) {
  const matchStage = { deviceId };
  if (startDate && endDate) {
    matchStage.timestamp = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$deviceId',
        totalIrrigations: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalWaterUsed: { $sum: '$waterAmount' },
        avgDuration: { $avg: '$duration' },
        avgWaterPerIrrigation: { $avg: '$waterAmount' },
        manualIrrigations: {
          $sum: { $cond: [{ $eq: ['$reason', 'manual'] }, 1, 0] }
        },
        scheduledIrrigations: {
          $sum: { $cond: [{ $eq: ['$reason', 'scheduled'] }, 1, 0] }
        },
        sensorTriggeredIrrigations: {
          $sum: { $cond: [{ $eq: ['$reason', 'sensor_triggered'] }, 1, 0] }
        },
        firstIrrigation: { $min: '$timestamp' },
        lastIrrigation: { $max: '$timestamp' }
      }
    }
  ]);
};

// Static method to get daily irrigation summary
irrigationEventSchema.statics.getDailySummary = function(deviceId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        deviceId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        irrigationCount: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalWaterUsed: { $sum: '$waterAmount' },
        avgSoilMoistureBefore: { $avg: '$soilMoistureBefore' },
        avgSoilMoistureAfter: { $avg: '$soilMoistureAfter' },
        date: { $first: '$timestamp' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]);
};

// Virtual for duration in minutes
irrigationEventSchema.virtual('durationMinutes').get(function() {
  return this.duration ? Math.round(this.duration / 60) : 0;
});

module.exports = mongoose.model('IrrigationEvent', irrigationEventSchema);
