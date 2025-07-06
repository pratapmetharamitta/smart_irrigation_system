import {DefaultTheme} from 'react-native-paper';

export const colors = {
  // Primary colors
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',
  
  // Secondary colors
  secondary: '#2196F3',
  secondaryDark: '#1976D2',
  secondaryLight: '#BBDEFB',
  
  // Accent colors
  accent: '#FF9800',
  accentDark: '#F57C00',
  accentLight: '#FFE0B2',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Neutral colors
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',
  outline: '#E0E0E0',
  
  // Text colors
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  onBackground: '#212121',
  
  // Irrigation specific colors
  water: '#2196F3',
  soil: '#8D6E63',
  plant: '#4CAF50',
  sun: '#FFC107',
  
  // Sensor colors
  temperature: '#FF5722',
  humidity: '#03A9F4',
  moisture: '#795548',
  light: '#FFEB3B',
  
  // Device status colors
  online: '#4CAF50',
  offline: '#9E9E9E',
  warning: '#FF9800',
  critical: '#F44336',
  
  // Chart colors
  chart: {
    temperature: '#FF5722',
    humidity: '#03A9F4',
    soilMoisture: '#795548',
    lightIntensity: '#FFEB3B',
    batteryLevel: '#4CAF50',
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...colors,
  },
  fonts: {
    ...DefaultTheme.fonts,
    titleLarge: {
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: 0.15,
    },
    titleMedium: {
      fontSize: 20,
      fontWeight: '600',
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      letterSpacing: 0.4,
    },
    labelLarge: {
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animations: {
    scale: 1.05,
    duration: {
      short: 150,
      medium: 300,
      long: 500,
    },
  },
};

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    // Dark theme colors
    primary: '#81C784',
    primaryDark: '#66BB6A',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    outline: '#424242',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#CCCCCC',
    onBackground: '#FFFFFF',
  },
};

export type Theme = typeof theme;
export type Colors = typeof colors;
