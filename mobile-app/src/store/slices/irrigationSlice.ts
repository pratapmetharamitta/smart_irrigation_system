import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface IrrigationZone {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isIrrigating: boolean;
  flowRate: number; // liters per minute
  pressure: number; // PSI
  duration: number; // minutes
  remainingTime?: number; // minutes
  lastIrrigated?: Date;
  soilMoisture?: number; // percentage
  cropType?: string;
  area: number; // square meters
}

export interface Schedule {
  id: string;
  zoneId: string;
  name: string;
  type: 'time' | 'volume' | 'sensor';
  startTime: string;
  duration?: number; // minutes
  volume?: number; // liters
  days: number[]; // 0-6 (Sunday-Saturday)
  isActive: boolean;
  conditions?: {
    minSoilMoisture?: number;
    maxSoilMoisture?: number;
    weatherCondition?: string;
  };
}

export interface IrrigationState {
  zones: IrrigationZone[];
  schedules: Schedule[];
  activeZones: string[];
  totalWaterUsage: number; // liters
  totalRuntime: number; // minutes
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Initial state
const initialState: IrrigationState = {
  zones: [],
  schedules: [],
  activeZones: [],
  totalWaterUsage: 0,
  totalRuntime: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchZones = createAsyncThunk(
  'irrigation/fetchZones',
  async () => {
    const response = await fetch('/api/irrigation/zones');
    if (!response.ok) {
      throw new Error('Failed to fetch zones');
    }
    const data = await response.json();
    return data;
  }
);

export const startIrrigation = createAsyncThunk(
  'irrigation/startIrrigation',
  async (params: { zoneId: string; duration: number }) => {
    const response = await fetch(`/api/irrigation/zones/${params.zoneId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration: params.duration }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to start irrigation');
    }
    
    const data = await response.json();
    return data;
  }
);

export const stopIrrigation = createAsyncThunk(
  'irrigation/stopIrrigation',
  async (zoneId: string) => {
    const response = await fetch(`/api/irrigation/zones/${zoneId}/stop`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop irrigation');
    }
    
    const data = await response.json();
    return data;
  }
);

export const createSchedule = createAsyncThunk(
  'irrigation/createSchedule',
  async (schedule: Omit<Schedule, 'id'>) => {
    const response = await fetch('/api/irrigation/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schedule),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create schedule');
    }
    
    const data = await response.json();
    return data;
  }
);

export const updateSchedule = createAsyncThunk(
  'irrigation/updateSchedule',
  async (params: { id: string; schedule: Partial<Schedule> }) => {
    const response = await fetch(`/api/irrigation/schedules/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.schedule),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update schedule');
    }
    
    const data = await response.json();
    return data;
  }
);

export const deleteSchedule = createAsyncThunk(
  'irrigation/deleteSchedule',
  async (scheduleId: string) => {
    const response = await fetch(`/api/irrigation/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete schedule');
    }
    
    return scheduleId;
  }
);

// Irrigation slice
const irrigationSlice = createSlice({
  name: 'irrigation',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateZoneStatus: (state, action: PayloadAction<{ zoneId: string; isIrrigating: boolean; remainingTime?: number }>) => {
      const zone = state.zones.find(z => z.id === action.payload.zoneId);
      if (zone) {
        zone.isIrrigating = action.payload.isIrrigating;
        if (action.payload.remainingTime !== undefined) {
          zone.remainingTime = action.payload.remainingTime;
        }
        
        // Update active zones list
        if (action.payload.isIrrigating) {
          if (!state.activeZones.includes(action.payload.zoneId)) {
            state.activeZones.push(action.payload.zoneId);
          }
        } else {
          state.activeZones = state.activeZones.filter(id => id !== action.payload.zoneId);
        }
      }
    },
    updateSoilMoisture: (state, action: PayloadAction<{ zoneId: string; moisture: number }>) => {
      const zone = state.zones.find(z => z.id === action.payload.zoneId);
      if (zone) {
        zone.soilMoisture = action.payload.moisture;
      }
    },
    updateWaterUsage: (state, action: PayloadAction<number>) => {
      state.totalWaterUsage += action.payload;
    },
    updateRuntime: (state, action: PayloadAction<number>) => {
      state.totalRuntime += action.payload;
    },
    setLastUpdated: (state) => {
      state.lastUpdated = new Date();
    },
  },
  extraReducers: (builder) => {
    // Fetch zones
    builder
      .addCase(fetchZones.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.isLoading = false;
        state.zones = action.payload;
        state.error = null;
        state.lastUpdated = new Date();
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch zones';
      });

    // Start irrigation
    builder
      .addCase(startIrrigation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startIrrigation.fulfilled, (state, action) => {
        state.isLoading = false;
        const zone = state.zones.find(z => z.id === action.payload.zoneId);
        if (zone) {
          zone.isIrrigating = true;
          zone.remainingTime = action.payload.duration;
          zone.lastIrrigated = new Date();
          if (!state.activeZones.includes(action.payload.zoneId)) {
            state.activeZones.push(action.payload.zoneId);
          }
        }
        state.error = null;
      })
      .addCase(startIrrigation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start irrigation';
      });

    // Stop irrigation
    builder
      .addCase(stopIrrigation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(stopIrrigation.fulfilled, (state, action) => {
        state.isLoading = false;
        const zone = state.zones.find(z => z.id === action.payload.zoneId);
        if (zone) {
          zone.isIrrigating = false;
          zone.remainingTime = 0;
          state.activeZones = state.activeZones.filter(id => id !== action.payload.zoneId);
        }
        state.error = null;
      })
      .addCase(stopIrrigation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to stop irrigation';
      });

    // Create schedule
    builder
      .addCase(createSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedules.push(action.payload);
        state.error = null;
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create schedule';
      });

    // Update schedule
    builder
      .addCase(updateSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.schedules.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.schedules[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update schedule';
      });

    // Delete schedule
    builder
      .addCase(deleteSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedules = state.schedules.filter(s => s.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete schedule';
      });
  },
});

// Export actions
export const {
  clearError,
  updateZoneStatus,
  updateSoilMoisture,
  updateWaterUsage,
  updateRuntime,
  setLastUpdated,
} = irrigationSlice.actions;

// Export reducer
export default irrigationSlice.reducer;
