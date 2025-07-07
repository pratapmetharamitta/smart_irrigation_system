import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authSlice from './slices/authSlice';
import irrigationSlice from './slices/irrigationSlice';
import sensorSlice from './slices/sensorSlice';
import alertSlice from './slices/alertSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  irrigation: irrigationSlice,
  sensors: sensorSlice,
  alerts: alertSlice,
});

// Redux persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'irrigation'], // Only persist auth and irrigation state
  blacklist: ['sensors', 'alerts'], // Don't persist real-time data
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Export store for use in app
export default store;
