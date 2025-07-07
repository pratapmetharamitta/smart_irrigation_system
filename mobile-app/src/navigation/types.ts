import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack Navigation Types
export type AuthStackParamList = {
  TestDemo: undefined;
  SimpleTest: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Main Tab Navigation Types
export type MainTabParamList = {
  Dashboard: undefined;
  Irrigation: undefined;
  Sensors: undefined;
  Alerts: undefined;
  Settings: undefined;
};

// Irrigation Stack Navigation Types
export type IrrigationStackParamList = {
  IrrigationHome: undefined;
  ZoneDetails: { zoneId: string };
  CreateSchedule: { zoneId?: string };
  EditSchedule: { scheduleId: string };
  ManualControl: { zoneId: string };
};

// Sensor Stack Navigation Types
export type SensorStackParamList = {
  SensorHome: undefined;
  SensorDetails: { sensorId: string };
  SensorHistory: { sensorId: string };
  SensorCalibration: { sensorId: string };
  WeatherDetails: undefined;
};

// Alert Stack Navigation Types
export type AlertStackParamList = {
  AlertHome: undefined;
  AlertDetails: { alertId: string };
  AlertSettings: undefined;
  NotificationSettings: undefined;
};

// Settings Stack Navigation Types
export type SettingsStackParamList = {
  SettingsHome: undefined;
  Profile: undefined;
  DeviceSettings: undefined;
  SystemSettings: undefined;
  About: undefined;
  Help: undefined;
};

// Root Stack Navigation Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Modal: {
    screen: string;
    params?: any;
  };
};

// Navigation prop types for type safety
export type NavigationProps = {
  navigation: any;
  route: any;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
