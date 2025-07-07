import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { MainTabParamList } from './types';
import { theme } from '../constants/theme';

// Import screens (will be created)
import DashboardScreen from '../screens/main/DashboardScreen';
import IrrigationScreen from '../screens/main/IrrigationScreen';
import SensorsScreen from '../screens/main/SensorsScreen';
import AlertsScreen from '../screens/main/AlertsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple icon component that works on web
const TabIcon: React.FC<{ symbol: string; color: string; size: number }> = ({ symbol, color, size }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: size, color }}>{symbol}</Text>
  </View>
);

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon symbol="📊" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Irrigation"
        component={IrrigationScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon symbol="💧" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Sensors"
        component={SensorsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon symbol="🔧" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon symbol="🔔" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon symbol="⚙️" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
