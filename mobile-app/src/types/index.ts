// Common types used throughout the application

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

// Irrigation system types
export interface Farm extends BaseEntity {
  name: string;
  description?: string;
  location: Location;
  area: number; // square meters
  cropType?: string;
  ownerId: string;
  timezone: string;
  weatherStationId?: string;
}

export interface Zone extends BaseEntity {
  farmId: string;
  name: string;
  description?: string;
  area: number; // square meters
  cropType?: string;
  soilType?: string;
  isActive: boolean;
  valveId?: string;
  sensorIds: string[];
}

export interface Device extends BaseEntity {
  name: string;
  type: 'controller' | 'sensor' | 'valve' | 'pump' | 'weather_station';
  model?: string;
  firmwareVersion?: string;
  batteryLevel?: number;
  signalStrength?: number;
  isOnline: boolean;
  lastSeen: Date;
  location?: Location;
  configuration: Record<string, any>;
}

// Sensor data types
export interface SensorValue {
  value: number;
  unit: string;
  quality: 'good' | 'fair' | 'poor';
  timestamp: Date;
}

export interface SensorData extends BaseEntity {
  sensorId: string;
  type: string;
  values: SensorValue[];
  metadata?: Record<string, any>;
}

// Weather types
export interface WeatherCondition {
  temperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // m/s
  windDirection: number; // degrees
  rainfall: number; // mm
  solarRadiation: number; // W/m²
  uvIndex: number;
  visibility: number; // km
  cloudCover: number; // %
  timestamp: Date;
}

export interface WeatherForecast {
  date: Date;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
}

// User and authentication types
export interface UserPermission {
  resource: string;
  actions: string[];
}

export interface UserProfile extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  role: 'farmer' | 'manager' | 'viewer' | 'admin';
  farmIds: string[];
  permissions: UserPermission[];
  preferences: {
    language: string;
    timezone: string;
    units: 'metric' | 'imperial';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  farmName?: string;
  role?: string;
}

// Notification and alert types
export interface Notification extends BaseEntity {
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'irrigation' | 'sensor' | 'weather' | 'system' | 'security';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  userId: string;
  sourceId?: string; // ID of the source (zone, sensor, etc.)
  data?: Record<string, any>;
  expiresAt?: Date;
}

// Schedule and automation types
export interface ScheduleCondition {
  type: 'time' | 'sensor' | 'weather';
  parameters: Record<string, any>;
}

export interface IrrigationSchedule extends BaseEntity {
  zoneId: string;
  name: string;
  description?: string;
  isActive: boolean;
  type: 'manual' | 'scheduled' | 'conditional';
  
  // Time-based scheduling
  startTime?: string; // HH:mm format
  duration?: number; // minutes
  days?: number[]; // 0-6 (Sunday-Saturday)
  
  // Volume-based scheduling
  targetVolume?: number; // liters
  
  // Conditional scheduling
  conditions?: ScheduleCondition[];
  
  // Advanced settings
  priority: number;
  maxDuration?: number; // minutes
  minInterval?: number; // minutes between runs
  weatherDependent?: boolean;
}

// Analytics and reporting types
export interface AnalyticsData {
  metric: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface Report extends BaseEntity {
  name: string;
  type: 'water_usage' | 'soil_conditions' | 'weather_summary' | 'system_performance';
  period: TimeRange;
  farmIds: string[];
  zoneIds?: string[];
  data: Record<string, any>;
  format: 'pdf' | 'csv' | 'json';
  status: 'generating' | 'ready' | 'failed';
  fileUrl?: string;
}

// Error and validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: ValidationError[];
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

export type SortOrder = 'asc' | 'desc';

export interface SortCriteria {
  field: string;
  order: SortOrder;
}

export interface FilterCriteria {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: SortCriteria[];
  filters?: FilterCriteria[];
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  id?: string;
}

export interface RealTimeUpdate {
  type: 'sensor_data' | 'zone_status' | 'alert' | 'device_status';
  entityId: string;
  data: any;
  timestamp: Date;
}
