import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';

// Smart Irrigation System theme following IoT best practices
const theme = {
  colors: {
    primary: '#2E7D32',
    accent: '#4CAF50',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#212121',
    placeholder: '#757575',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
};

// IoT Configuration
const IoTConfig = {
  BACKEND_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.smart-irrigation.com',
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  DEVICE_TIMEOUT: 10000, // 10 seconds
};

// Types for IoT system
interface SystemHealth {
  app: string;
  backend: string;
  devices: string;
  mqtt: string;
}

interface BackendHealth {
  status: string;
  timestamp: string;
  environment: string;
  uptime: number;
  services: {
    database: string;
    mqtt: string;
    api: string;
  };
}

// IoT System Information Component
const IoTSystemInfo: React.FC = () => {
  const systemInfo = {
    appName: Constants.expoConfig?.name || 'Smart Irrigation System',
    version: Constants.expoConfig?.version || '1.0.0',
    platform: Constants.platform,
    expoVersion: Constants.expoVersion,
    sdkVersion: Constants.expoConfig?.sdkVersion || 'Not detected',
  };

  return (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>System Information</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Name</Text>
          <Text style={styles.infoValue}>{systemInfo.appName}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>{systemInfo.version}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>
            {systemInfo.platform?.ios ? 'iOS' : systemInfo.platform?.android ? 'Android' : 'Web'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Expo Version</Text>
          <Text style={styles.infoValue}>{systemInfo.expoVersion}</Text>
        </View>
      </View>
    </View>
  );
};

// IoT System Status Component with real backend integration
const IoTSystemStatus: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    app: 'healthy',
    backend: 'checking...',
    devices: 'checking...',
    mqtt: 'checking...',
  });

  const [backendData, setBackendData] = useState<BackendHealth | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Health check function following IoT best practices
  const checkSystemHealth = async (): Promise<void> => {
    try {
      console.log('🔍 Checking backend health...');
      
      // Check backend health endpoint
      const response = await axios.get(`${IoTConfig.BACKEND_URL}/health`, {
        timeout: IoTConfig.DEVICE_TIMEOUT,
      });

      const healthData: BackendHealth = response.data;
      setBackendData(healthData);
      
      // Update system health based on backend response
      setSystemHealth({
        app: 'healthy',
        backend: healthData.status === 'healthy' ? 'connected' : 'error',
        devices: healthData.services?.database === 'connected' ? 'online' : 'offline',
        mqtt: healthData.services?.mqtt === 'connected' ? 'connected' : 'disconnected',
      });

      setLastCheck(new Date());
      console.log('✅ Health check completed successfully');
    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      // Update system health for error state
      setSystemHealth(prev => ({
        ...prev,
        backend: 'error',
        devices: 'offline',
        mqtt: 'disconnected',
      }));
      
      setLastCheck(new Date());
    }
  };

  // Setup health check interval
  useEffect(() => {
    // Initial health check
    checkSystemHealth();
    
    // Set up periodic health checks
    const interval = setInterval(checkSystemHealth, IoTConfig.HEALTH_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  const handleStatusTap = (service: string): void => {
    const serviceStatus = systemHealth[service as keyof SystemHealth];
    const additionalInfo = backendData ? `
Backend Environment: ${backendData.environment}
Uptime: ${Math.floor(backendData.uptime)}s
Last Check: ${lastCheck.toLocaleTimeString()}
    ` : '';

    Alert.alert(
      `${service.charAt(0).toUpperCase() + service.slice(1)} Status`,
      `Current status: ${serviceStatus}${additionalInfo}`,
      [
        { text: 'Refresh', onPress: checkSystemHealth },
        { text: 'OK' }
      ]
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'online':
        return theme.colors.success;
      case 'checking...':
        return theme.colors.warning;
      case 'error':
      case 'offline':
      case 'disconnected':
        return theme.colors.error;
      default:
        return theme.colors.placeholder;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'online':
        return '✅';
      case 'checking...':
        return '🔄';
      case 'error':
      case 'offline':
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusTitle}>IoT System Status</Text>
        <TouchableOpacity onPress={checkSystemHealth} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statusGrid}>
        <TouchableOpacity style={styles.statusItem} onPress={() => handleStatusTap('app')}>
          <Text style={styles.statusLabel}>Mobile App</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(systemHealth.app) }]}>
            {getStatusIcon(systemHealth.app)} {systemHealth.app}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statusItem} onPress={() => handleStatusTap('backend')}>
          <Text style={styles.statusLabel}>Cloud Backend</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(systemHealth.backend) }]}>
            {getStatusIcon(systemHealth.backend)} {systemHealth.backend}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statusItem} onPress={() => handleStatusTap('devices')}>
          <Text style={styles.statusLabel}>IoT Devices</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(systemHealth.devices) }]}>
            {getStatusIcon(systemHealth.devices)} {systemHealth.devices}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statusItem} onPress={() => handleStatusTap('mqtt')}>
          <Text style={styles.statusLabel}>MQTT Broker</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(systemHealth.mqtt) }]}>
            {getStatusIcon(systemHealth.mqtt)} {systemHealth.mqtt}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.lastCheckText}>
        Last checked: {lastCheck.toLocaleTimeString()}
      </Text>
    </View>
  );
};

// Main App Component following IoT architecture
const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <ScrollView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Smart Irrigation System</Text>
              <Text style={styles.subtitle}>IoT Mobile Application</Text>
              <Text style={styles.description}>
                Comprehensive IoT solution for agricultural automation
              </Text>
            </View>

            <IoTSystemInfo />
            <IoTSystemStatus />

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>IoT Features</Text>
              <View style={styles.featuresList}>
                <Text style={styles.featureItem}>📊 Real-time sensor monitoring</Text>
                <Text style={styles.featureItem}>💧 Remote irrigation control</Text>
                <Text style={styles.featureItem}>🌡️ Temperature & humidity tracking</Text>
                <Text style={styles.featureItem}>💾 Soil moisture analytics</Text>
                <Text style={styles.featureItem}>🔔 Smart alert notifications</Text>
                <Text style={styles.featureItem}>📱 Cross-platform compatibility</Text>
                <Text style={styles.featureItem}>🌐 Cloud data synchronization</Text>
                <Text style={styles.featureItem}>🔋 Battery level monitoring</Text>
              </View>
            </View>

            <View style={styles.architectureContainer}>
              <Text style={styles.architectureTitle}>System Architecture</Text>
              <View style={styles.architectureFlow}>
                <Text style={styles.architectureStep}>ESP32 Sensors → MQTT → Cloud Backend → Mobile App</Text>
                <Text style={styles.architectureDetails}>
                  Following IoT best practices with proper error handling and real-time communication
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Built with React Native, TypeScript, and IoT best practices
              </Text>
            </View>
          </ScrollView>
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#2E7D32',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#C8E6C9',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#E8F5E8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
  },
  refreshText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lastCheckText: {
    fontSize: 10,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresList: {
    paddingHorizontal: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    lineHeight: 20,
  },
  architectureContainer: {
    backgroundColor: '#E8F5E8',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 1,
  },
  architectureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  architectureFlow: {
    alignItems: 'center',
  },
  architectureStep: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  architectureDetails: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default App;