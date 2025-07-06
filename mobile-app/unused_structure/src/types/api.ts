// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// HTTP Request Types
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  language: string;
  units: 'metric' | 'imperial';
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// Device Types
export interface Device {
  id: string;
  name: string;
  type: 'controller' | 'sensor' | 'actuator';
  model: string;
  location: DeviceLocation;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  battery?: number;
  rssi?: number;
  configuration: DeviceConfiguration;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  address?: string;
  zone?: string;
}

export interface DeviceConfiguration {
  sensors: SensorConfig[];
  actuators: ActuatorConfig[];
  communicationSettings: CommunicationSettings;
  powerSettings: PowerSettings;
}

export interface SensorConfig {
  type: 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'ph' | 'ec' | 'pressure';
  pin: number;
  enabled: boolean;
  calibration?: CalibrationData;
  thresholds?: ThresholdSettings;
}

export interface ActuatorConfig {
  type: 'pump' | 'valve' | 'fan' | 'heater' | 'cooler' | 'light';
  pin: number;
  enabled: boolean;
  powerRating?: number;
  operatingVoltage?: number;
}

export interface CommunicationSettings {
  protocol: 'mqtt' | 'http' | 'lora' | 'cellular';
  interval: number;
  retryAttempts: number;
  timeout: number;
}

export interface PowerSettings {
  mode: 'always_on' | 'scheduled' | 'battery_saver';
  sleepInterval?: number;
  wakeInterval?: number;
}

export interface CalibrationData {
  slope: number;
  intercept: number;
  lastCalibrated: string;
}

export interface ThresholdSettings {
  min: number;
  max: number;
  critical: number;
  alertEnabled: boolean;
}

// Sensor Data Types
export interface SensorData {
  id: string;
  deviceId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
  quality: 'good' | 'fair' | 'poor';
  metadata?: Record<string, any>;
}

export interface SensorDataQuery {
  deviceId?: string;
  sensorType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  aggregation?: 'raw' | 'hourly' | 'daily' | 'weekly' | 'monthly';
}

// Irrigation Types
export interface IrrigationEvent {
  id: string;
  deviceId: string;
  type: 'manual' | 'scheduled' | 'automatic';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration: number;
  waterAmount?: number;
  triggeredBy?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IrrigationSchedule {
  id: string;
  deviceId: string;
  name: string;
  enabled: boolean;
  schedule: SchedulePattern;
  duration: number;
  waterAmount?: number;
  conditions?: IrrigationCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePattern {
  type: 'daily' | 'weekly' | 'monthly';
  time: string;
  days?: number[];
  dates?: number[];
  interval?: number;
}

export interface IrrigationCondition {
  sensorType: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  required: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalSensors: number;
  recentAlerts: number;
  waterUsage: {
    today: number;
    week: number;
    month: number;
  };
  sensorAverages: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
  };
}

export interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  recent: Alert[];
}

export interface Alert {
  id: string;
  deviceId: string;
  type: 'sensor' | 'device' | 'irrigation' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  acknowledged: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  color: string;
  unit: string;
}
