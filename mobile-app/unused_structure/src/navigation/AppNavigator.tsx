import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import DevicesScreen from '../screens/main/DevicesScreen';
import SensorsScreen from '../screens/main/SensorsScreen';
import IrrigationScreen from '../screens/main/IrrigationScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Detail Screens
import DeviceDetailScreen from '../screens/detail/DeviceDetailScreen';
import SensorDetailScreen from '../screens/detail/SensorDetailScreen';
import IrrigationDetailScreen from '../screens/detail/IrrigationDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Devices') {
            iconName = 'devices';
          } else if (route.name === 'Sensors') {
            iconName = 'sensors';
          } else if (route.name === 'Irrigation') {
            iconName = 'water-drop';
          } else if (route.name === 'Alerts') {
            iconName = 'notifications';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Devices" component={DevicesScreen} />
      <Tab.Screen name="Sensors" component={SensorsScreen} />
      <Tab.Screen name="Irrigation" component={IrrigationScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
};

const MainStack = () => {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text.primary,
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="DeviceDetail" 
        component={DeviceDetailScreen} 
        options={{ title: 'Device Details' }}
      />
      <Stack.Screen 
        name="SensorDetail" 
        component={SensorDetailScreen} 
        options={{ title: 'Sensor Details' }}
      />
      <Stack.Screen 
        name="IrrigationDetail" 
        component={IrrigationDetailScreen} 
        options={{ title: 'Irrigation Details' }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer
      theme={{
        dark: colorScheme === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text.primary,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
