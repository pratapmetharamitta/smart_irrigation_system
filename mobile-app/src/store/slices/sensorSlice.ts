import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'fair' | 'poor';
}

export interface Sensor {
  id: string;
  name: string;
  type: 'soil_moisture' | 'soil_temperature' | 'soil_ph' | 'soil_ec' | 'ambient_temperature' | 'humidity' | 'pressure' | 'flow' | 'water_level';
  location: string;
  zoneId?: string;
  isActive: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  lastReading?: SensorReading;
  calibration?: {
    offset: number;
    multiplier: number;
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  rainfall: number;
  solarRadiation: number;
  timestamp: Date;
  forecast?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    description: string;
  }[];
}

export interface SensorState {
  sensors: Sensor[];
  readings: SensorReading[];
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Initial state
const initialState: SensorState = {
  sensors: [],
  readings: [],
  weatherData: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchSensors = createAsyncThunk(
  'sensors/fetchSensors',
  async () => {
    const response = await fetch('/api/sensors');
    if (!response.ok) {
      throw new Error('Failed to fetch sensors');
    }
    const data = await response.json();
    return data;
  }
);

export const fetchSensorReadings = createAsyncThunk(
  'sensors/fetchSensorReadings',
  async (params: { sensorId?: string; timeRange?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.sensorId) queryParams.append('sensorId', params.sensorId);
    if (params.timeRange) queryParams.append('timeRange', params.timeRange);
    
    const response = await fetch(`/api/sensors/readings?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sensor readings');
    }
    const data = await response.json();
    return data;
  }
);

export const fetchWeatherData = createAsyncThunk(
  'sensors/fetchWeatherData',
  async () => {
    const response = await fetch('/api/weather');
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const data = await response.json();
    return data;
  }
);

export const calibrateSensor = createAsyncThunk(
  'sensors/calibrateSensor',
  async (params: { sensorId: string; calibration: { offset: number; multiplier: number } }) => {
    const response = await fetch(`/api/sensors/${params.sensorId}/calibrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.calibration),
    });
    
    if (!response.ok) {
      throw new Error('Failed to calibrate sensor');
    }
    
    const data = await response.json();
    return data;
  }
);

// Sensor slice
const sensorSlice = createSlice({
  name: 'sensors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addSensorReading: (state, action: PayloadAction<SensorReading>) => {
      state.readings.unshift(action.payload);
      
      // Update sensor's last reading
      const sensor = state.sensors.find(s => s.id === action.payload.sensorId);
      if (sensor) {
        sensor.lastReading = action.payload;
      }
      
      // Keep only last 1000 readings to prevent memory issues
      if (state.readings.length > 1000) {
        state.readings = state.readings.slice(0, 1000);
      }
      
      state.lastUpdated = new Date();
    },
    updateSensorStatus: (state, action: PayloadAction<{ sensorId: string; isActive: boolean; batteryLevel?: number; signalStrength?: number }>) => {
      const sensor = state.sensors.find(s => s.id === action.payload.sensorId);
      if (sensor) {
        sensor.isActive = action.payload.isActive;
        if (action.payload.batteryLevel !== undefined) {
          sensor.batteryLevel = action.payload.batteryLevel;
        }
        if (action.payload.signalStrength !== undefined) {
          sensor.signalStrength = action.payload.signalStrength;
        }
      }
    },
    updateWeatherData: (state, action: PayloadAction<WeatherData>) => {
      state.weatherData = action.payload;
      state.lastUpdated = new Date();
    },
    clearOldReadings: (state, action: PayloadAction<{ olderThan: Date }>) => {
      state.readings = state.readings.filter(reading => new Date(reading.timestamp) > action.payload.olderThan);
    },
    setLastUpdated: (state) => {
      state.lastUpdated = new Date();
    },
  },
  extraReducers: (builder) => {
    // Fetch sensors
    builder
      .addCase(fetchSensors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSensors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sensors = action.payload;
        state.error = null;
        state.lastUpdated = new Date();
      })
      .addCase(fetchSensors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sensors';
      });

    // Fetch sensor readings
    builder
      .addCase(fetchSensorReadings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSensorReadings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.readings = action.payload;
        state.error = null;
        state.lastUpdated = new Date();
      })
      .addCase(fetchSensorReadings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch sensor readings';
      });

    // Fetch weather data
    builder
      .addCase(fetchWeatherData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWeatherData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.weatherData = action.payload;
        state.error = null;
        state.lastUpdated = new Date();
      })
      .addCase(fetchWeatherData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch weather data';
      });

    // Calibrate sensor
    builder
      .addCase(calibrateSensor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(calibrateSensor.fulfilled, (state, action) => {
        state.isLoading = false;
        const sensor = state.sensors.find(s => s.id === action.payload.sensorId);
        if (sensor) {
          sensor.calibration = action.payload.calibration;
        }
        state.error = null;
      })
      .addCase(calibrateSensor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to calibrate sensor';
      });
  },
});

// Export actions
export const {
  clearError,
  addSensorReading,
  updateSensorStatus,
  updateWeatherData,
  clearOldReadings,
  setLastUpdated,
} = sensorSlice.actions;

// Export reducer
export default sensorSlice.reducer;
