const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['edge_device', 'lora_node', 'sensor_node'],
    required: true
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'offline'
  },
  irrigationStatus: {
    type: String,
    enum: ['active', 'inactive', 'scheduled', 'error'],
    default: 'inactive'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  rssi: {
    type: Number
  },
  firmwareVersion: {
    type: String
  },
  freeHeap: {
    type: Number
  },
  configuration: {
    irrigationThreshold: { type: Number, default: 30 },
    irrigationDuration: { type: Number, default: 300 },
    sensorInterval: { type: Number, default: 60 },
    sleepMode: { type: Boolean, default: false },
    autoIrrigation: { type: Boolean, default: true }
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ userId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ lastSeen: 1 });

// Virtual for device uptime
deviceSchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastSeen > fiveMinutesAgo;
});

// Method to update device status
deviceSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  this.lastSeen = new Date();
  Object.assign(this, additionalData);
  return this.save();
};

module.exports = mongoose.model('Device', deviceSchema);
