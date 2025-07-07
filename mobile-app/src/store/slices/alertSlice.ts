import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'irrigation' | 'sensor' | 'weather' | 'system' | 'security';
  title: string;
  message: string;
  source?: string; // zone ID, sensor ID, etc.
  timestamp: Date;
  isRead: boolean;
  isResolved: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions?: {
    label: string;
    action: string;
    params?: Record<string, any>;
  }[];
}

export interface NotificationSettings {
  enabled: boolean;
  categories: {
    irrigation: boolean;
    sensor: boolean;
    weather: boolean;
    system: boolean;
    security: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Initial state
const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  settings: {
    enabled: true,
    categories: {
      irrigation: true,
      sensor: true,
      weather: true,
      system: true,
      security: true,
    },
    priority: {
      low: true,
      medium: true,
      high: true,
      critical: true,
    },
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (params?: { category?: string; priority?: string; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const response = await fetch(`/api/alerts?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }
    const data = await response.json();
    return data;
  }
);

export const markAlertAsRead = createAsyncThunk(
  'alerts/markAsRead',
  async (alertId: string) => {
    const response = await fetch(`/api/alerts/${alertId}/read`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark alert as read');
    }
    
    return alertId;
  }
);

export const resolveAlert = createAsyncThunk(
  'alerts/resolveAlert',
  async (alertId: string) => {
    const response = await fetch(`/api/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error('Failed to resolve alert');
    }
    
    return alertId;
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'alerts/updateSettings',
  async (settings: NotificationSettings) => {
    const response = await fetch('/api/alerts/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update notification settings');
    }
    
    const data = await response.json();
    return data;
  }
);

export const deleteAlert = createAsyncThunk(
  'alerts/deleteAlert',
  async (alertId: string) => {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete alert');
    }
    
    return alertId;
  }
);

// Alert slice
const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      state.lastUpdated = new Date();
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.isRead) {
        alert.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.alerts.forEach(alert => {
        alert.isRead = true;
      });
      state.unreadCount = 0;
    },
    resolve: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert) {
        alert.isResolved = true;
      }
    },
    clearResolvedAlerts: (state) => {
      const unresolvedAlerts = state.alerts.filter(alert => !alert.isResolved);
      const resolvedCount = state.alerts.length - unresolvedAlerts.length;
      state.alerts = unresolvedAlerts;
      
      // Adjust unread count
      const resolvedUnreadCount = state.alerts.filter(alert => alert.isResolved && !alert.isRead).length;
      state.unreadCount = Math.max(0, state.unreadCount - resolvedUnreadCount);
    },
    clearOldAlerts: (state, action: PayloadAction<{ olderThan: Date }>) => {
      const oldAlerts = state.alerts.filter(alert => new Date(alert.timestamp) <= action.payload.olderThan);
      const oldUnreadCount = oldAlerts.filter(alert => !alert.isRead).length;
      
      state.alerts = state.alerts.filter(alert => new Date(alert.timestamp) > action.payload.olderThan);
      state.unreadCount = Math.max(0, state.unreadCount - oldUnreadCount);
    },
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setLastUpdated: (state) => {
      state.lastUpdated = new Date();
    },
  },
  extraReducers: (builder) => {
    // Fetch alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
        state.unreadCount = action.payload.filter((alert: Alert) => !alert.isRead).length;
        state.error = null;
        state.lastUpdated = new Date();
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch alerts';
      });

    // Mark alert as read
    builder
      .addCase(markAlertAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAlertAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert && !alert.isRead) {
          alert.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markAlertAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to mark alert as read';
      });

    // Resolve alert
    builder
      .addCase(resolveAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resolveAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert) {
          alert.isResolved = true;
        }
        state.error = null;
      })
      .addCase(resolveAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to resolve alert';
      });

    // Update notification settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update notification settings';
      });

    // Delete alert
    builder
      .addCase(deleteAlert.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.isLoading = false;
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert && !alert.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.alerts = state.alerts.filter(a => a.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteAlert.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete alert';
      });
  },
});

// Export actions
export const {
  clearError,
  addAlert,
  markAsRead,
  markAllAsRead,
  resolve,
  clearResolvedAlerts,
  clearOldAlerts,
  updateSettings,
  setLastUpdated,
} = alertSlice.actions;

// Export reducer
export default alertSlice.reducer;
