import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

// Smart Irrigation System theme following IoT best practices
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',        // Dark green for irrigation
    primaryContainer: '#A5D6A7', // Light green container
    secondary: '#4CAF50',       // Accent green
    secondaryContainer: '#C8E6C9', // Light accent container
    tertiary: '#1976D2',        // Blue for water/sensors
    tertiaryContainer: '#BBDEFB', // Light blue container
    background: '#F5F5F5',      // Light grey background
    surface: '#FFFFFF',         // White surface
    surfaceVariant: '#E8F5E8',  // Very light green
    outline: '#757575',         // Grey outline
    outlineVariant: '#BDBDBD',  // Light grey outline
    onPrimary: '#FFFFFF',       // White text on primary
    onSecondary: '#FFFFFF',     // White text on secondary
    onTertiary: '#FFFFFF',      // White text on tertiary
    onBackground: '#212121',    // Dark text on background
    onSurface: '#212121',       // Dark text on surface
    onSurfaceVariant: '#424242', // Dark grey text on surface variant
    success: '#4CAF50',         // Success green
    warning: '#FF9800',         // Warning orange
    error: '#F44336',           // Error red
    info: '#2196F3',            // Info blue
    // Custom colors for irrigation system
    waterBlue: '#2196F3',
    soilBrown: '#8D6E63',
    plantGreen: '#66BB6A',
    sunYellow: '#FFC107',
    alertRed: '#F44336',
  },
  fonts: {
    ...DefaultTheme.fonts,
    displayLarge: {
      ...DefaultTheme.fonts.displayLarge,
      fontFamily: 'System',
    },
    displayMedium: {
      ...DefaultTheme.fonts.displayMedium,
      fontFamily: 'System',
    },
    displaySmall: {
      ...DefaultTheme.fonts.displaySmall,
      fontFamily: 'System',
    },
    headlineLarge: {
      ...DefaultTheme.fonts.headlineLarge,
      fontFamily: 'System',
    },
    headlineMedium: {
      ...DefaultTheme.fonts.headlineMedium,
      fontFamily: 'System',
    },
    headlineSmall: {
      ...DefaultTheme.fonts.headlineSmall,
      fontFamily: 'System',
    },
    titleLarge: {
      ...DefaultTheme.fonts.titleLarge,
      fontFamily: 'System',
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontFamily: 'System',
    },
    titleSmall: {
      ...DefaultTheme.fonts.titleSmall,
      fontFamily: 'System',
    },
    labelLarge: {
      ...DefaultTheme.fonts.labelLarge,
      fontFamily: 'System',
    },
    labelMedium: {
      ...DefaultTheme.fonts.labelMedium,
      fontFamily: 'System',
    },
    labelSmall: {
      ...DefaultTheme.fonts.labelSmall,
      fontFamily: 'System',
    },
    bodyLarge: {
      ...DefaultTheme.fonts.bodyLarge,
      fontFamily: 'System',
    },
    bodyMedium: {
      ...DefaultTheme.fonts.bodyMedium,
      fontFamily: 'System',
    },
    bodySmall: {
      ...DefaultTheme.fonts.bodySmall,
      fontFamily: 'System',
    },
  },
  roundness: 12, // Rounded corners for modern look
};

// Type for theme
export type ThemeType = typeof theme;
