const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    trim: true
  },
  edgeDeviceId: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  temperature: {
    type: Number,
    min: -50,
    max: 100
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100
  },
  soilMoisture: {
    type: Number,
    min: 0,
    max: 100
  },
  lightIntensity: {
    type: Number,
    min: 0
  },
  ph: {
    type: Number,
    min: 0,
    max: 14
  },
  ec: {
    type: Number,
    min: 0
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  rssi: {
    type: Number
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });
sensorDataSchema.index({ timestamp: -1 });
sensorDataSchema.index({ deviceId: 1 });
sensorDataSchema.index({ edgeDeviceId: 1 });

// Static method to get latest data for a device
sensorDataSchema.statics.getLatestByDevice = function(deviceId) {
  return this.findOne({ deviceId }).sort({ timestamp: -1 });
};

// Static method to get data within time range
sensorDataSchema.statics.getDataInRange = function(deviceId, startDate, endDate) {
  const query = { deviceId };
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get aggregated data
sensorDataSchema.statics.getAggregatedData = function(deviceId, interval = 'hour') {
  const groupBy = {
    hour: {
      year: { $year: '$timestamp' },
      month: { $month: '$timestamp' },
      day: { $dayOfMonth: '$timestamp' },
      hour: { $hour: '$timestamp' }
    },
    day: {
      year: { $year: '$timestamp' },
      month: { $month: '$timestamp' },
      day: { $dayOfMonth: '$timestamp' }
    },
    week: {
      year: { $year: '$timestamp' },
      week: { $week: '$timestamp' }
    }
  };

  return this.aggregate([
    { $match: { deviceId } },
    {
      $group: {
        _id: groupBy[interval],
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
        count: { $sum: 1 },
        firstReading: { $min: '$timestamp' },
        lastReading: { $max: '$timestamp' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.hour': -1 } }
  ]);
};

module.exports = mongoose.model('SensorData', sensorDataSchema);
