// IoT Configuration
export const IoTConfig = {
  // Backend URLs
  BACKEND_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.smart-irrigation.com',
  WEBSOCKET_URL: __DEV__ ? 'ws://localhost:3000' : 'wss://api.smart-irrigation.com',
  
  // Timing configurations
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  DEVICE_TIMEOUT: 10000, // 10 seconds
  SENSOR_UPDATE_INTERVAL: 5000, // 5 seconds
  WEATHER_UPDATE_INTERVAL: 300000, // 5 minutes
  
  // Connection configurations
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  CONNECTION_TIMEOUT: 15000, // 15 seconds
  
  // Data configurations
  MAX_SENSOR_READINGS: 1000, // Keep last 1000 readings in memory
  MAX_ALERTS: 100, // Keep last 100 alerts
  CACHE_DURATION: 300000, // 5 minutes cache
  
  // Feature flags
  FEATURES: {
    BIOMETRIC_AUTH: true,
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: true,
    ANALYTICS: true,
    DEBUG_MODE: __DEV__,
  },
  
  // Irrigation system constants
  IRRIGATION: {
    MIN_DURATION: 1, // minutes
    MAX_DURATION: 240, // 4 hours
    DEFAULT_DURATION: 30, // minutes
    MIN_FLOW_RATE: 0.1, // L/min
    MAX_FLOW_RATE: 100, // L/min
    MIN_PRESSURE: 5, // PSI
    MAX_PRESSURE: 80, // PSI
  },
  
  // Sensor thresholds
  SENSORS: {
    SOIL_MOISTURE: {
      MIN: 0, // %
      MAX: 100, // %
      LOW_THRESHOLD: 30, // %
      HIGH_THRESHOLD: 80, // %
    },
    TEMPERATURE: {
      MIN: -10, // °C
      MAX: 60, // °C
      LOW_THRESHOLD: 5, // °C
      HIGH_THRESHOLD: 35, // °C
    },
    PH: {
      MIN: 0,
      MAX: 14,
      LOW_THRESHOLD: 5.5,
      HIGH_THRESHOLD: 7.5,
    },
    EC: {
      MIN: 0, // mS/cm
      MAX: 10, // mS/cm
      LOW_THRESHOLD: 0.5, // mS/cm
      HIGH_THRESHOLD: 3.0, // mS/cm
    },
  },
  
  // Communication protocols
  COMMUNICATION: {
    LORA: {
      FREQUENCY: 915, // MHz (US frequency)
      SPREADING_FACTOR: 7,
      BANDWIDTH: 125, // kHz
      CODING_RATE: 5,
      SYNC_WORD: 0x34,
    },
    WIFI: {
      RECONNECT_INTERVAL: 5000, // 5 seconds
      MAX_RECONNECT_ATTEMPTS: 5,
    },
    GSM: {
      APN: 'internet',
      RECONNECT_INTERVAL: 10000, // 10 seconds
      MAX_RECONNECT_ATTEMPTS: 3,
    },
  },
  
  // App version and build info
  APP: {
    VERSION: '1.0.0',
    BUILD_NUMBER: 1,
    MIN_OS_VERSION: {
      IOS: '12.0',
      ANDROID: '6.0',
    },
  },
};

// Environment-specific configurations
export const getConfig = () => {
  if (__DEV__) {
    return {
      ...IoTConfig,
      // Development overrides
      SENSOR_UPDATE_INTERVAL: 2000, // Faster updates in dev
      WEATHER_UPDATE_INTERVAL: 60000, // 1 minute in dev
      FEATURES: {
        ...IoTConfig.FEATURES,
        DEBUG_MODE: true,
      },
    };
  }
  
  return IoTConfig;
};

// Export default config
export default getConfig();
