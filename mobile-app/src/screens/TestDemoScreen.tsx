import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Text,
  Surface,
  IconButton,
  Chip,
  Badge,
  ProgressBar,
  Switch,
  Divider
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, logoutUser } from '../store/slices/authSlice';
import { theme } from '../constants/theme';

const TestDemoScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { zones } = useAppSelector((state) => state.irrigation);
  const { sensors } = useAppSelector((state) => state.sensors);
  const { alerts } = useAppSelector((state) => state.alerts);
  
  const [irrigationActive, setIrrigationActive] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  const handleTestLogin = async () => {
    try {
      // Simulate successful login with mock data
      const mockUser = {
        id: 'test-user-123',
        name: 'John Farmer',
        email: 'john@smartfarm.com',
        farmId: 'farm-001',
        role: 'farmer'
      };
      
      // This will be handled by the actual login logic
      console.log('Test login attempted');
    } catch (error) {
      console.log('Expected test error:', error);
    }
  };

  const mockSensorData = [
    { name: 'Soil Moisture Zone A', value: 65, unit: '%', status: 'good', icon: 'water-percent' },
    { name: 'Temperature', value: 24, unit: '°C', status: 'optimal', icon: 'thermometer' },
    { name: 'Humidity', value: 58, unit: '%', status: 'good', icon: 'water' },
    { name: 'Light Level', value: 75, unit: '%', status: 'excellent', icon: 'white-balance-sunny' },
  ];

  const mockZones = [
    { name: 'Zone A - Tomatoes', status: 'Active', duration: '15 min', progress: 0.6 },
    { name: 'Zone B - Lettuce', status: 'Scheduled', duration: '10 min', progress: 0.0 },
    { name: 'Zone C - Herbs', status: 'Completed', duration: '8 min', progress: 1.0 },
  ];

  const mockAlerts = [
    { type: 'warning', title: 'Low Soil Moisture in Zone D', time: '2 min ago' },
    { type: 'info', title: 'Weather Update: Rain expected', time: '1 hour ago' },
    { type: 'success', title: 'Zone A irrigation completed', time: '2 hours ago' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>🌱 Smart Irrigation Demo</Title>
          <Paragraph style={styles.headerSubtitle}>
            Interactive Mobile App Preview
          </Paragraph>
        </View>
        <IconButton 
          icon="cog" 
          size={24} 
          onPress={() => {}}
        />
      </View>

      {/* Authentication Status */}
      <Card style={styles.card}>
        <Card.Title 
          title="Authentication Status" 
          left={(props) => <IconButton {...props} icon="account-circle" size={24} />}
        />
        <Card.Content>
          <View style={styles.authStatus}>
            <Text>Status: {isAuthenticated ? '✅ Logged In' : '❌ Not Authenticated'}</Text>
            <Text>User: {user?.name || 'No user logged in'}</Text>
            <Text>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              onPress={handleTestLogin}
              style={styles.testButton}
              disabled={isLoading}
            >
              Test Login
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => dispatch(logoutUser())}
              style={styles.testButton}
            >
              Logout
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* System Overview */}
      <Card style={styles.card}>
        <Card.Title 
          title="System Overview" 
          left={(props) => <IconButton {...props} icon="view-dashboard" size={24} />}
        />
        <Card.Content>
          <View style={styles.statsRow}>
            <Surface style={styles.statCard}>
              <IconButton icon="water" size={20} iconColor={theme.colors.primary} />
              <Text style={styles.statNumber}>{zones.length}</Text>
              <Text style={styles.statLabel}>Zones</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <IconButton icon="chip" size={20} iconColor={theme.colors.secondary} />
              <Text style={styles.statNumber}>{sensors.length}</Text>
              <Text style={styles.statLabel}>Sensors</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <IconButton icon="bell" size={20} iconColor={theme.colors.error} />
              <Text style={styles.statNumber}>{alerts.length}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </Surface>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Controls */}
      <Card style={styles.card}>
        <Card.Title 
          title="Quick Controls" 
          left={(props) => <IconButton {...props} icon="lightning-bolt" size={24} />}
        />
        <Card.Content>
          <View style={styles.controlRow}>
            <View style={styles.switchContainer}>
              <Text>Emergency Stop</Text>
              <Switch 
                value={irrigationActive} 
                onValueChange={setIrrigationActive}
                thumbColor={irrigationActive ? theme.colors.primary : theme.colors.outline}
              />
            </View>
            <View style={styles.switchContainer}>
              <Text>Auto Mode</Text>
              <Switch 
                value={autoMode} 
                onValueChange={setAutoMode}
                thumbColor={autoMode ? theme.colors.primary : theme.colors.outline}
              />
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.buttonRow}>
            <Button mode="contained" icon="play" style={styles.actionButton}>
              Start All
            </Button>
            <Button mode="outlined" icon="stop" style={styles.actionButton}>
              Stop All
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Sensor Readings */}
      <Card style={styles.card}>
        <Card.Title 
          title="Live Sensor Data" 
          left={(props) => <IconButton {...props} icon="chart-line" size={24} />}
        />
        <Card.Content>
          {mockSensorData.map((sensor, index) => (
            <View key={index} style={styles.sensorItem}>
              <View style={styles.sensorHeader}>
                <IconButton 
                  icon={sensor.icon} 
                  size={20} 
                  iconColor={theme.colors.primary} 
                />
                <Text style={styles.sensorName}>{sensor.name}</Text>
                <Chip 
                  mode="outlined" 
                  compact
                  textStyle={styles.chipText}
                >
                  {sensor.status}
                </Chip>
              </View>
              <Text style={styles.sensorValue}>
                {sensor.value} {sensor.unit}
              </Text>
              <ProgressBar 
                progress={sensor.value / 100} 
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Irrigation Zones */}
      <Card style={styles.card}>
        <Card.Title 
          title="Irrigation Zones" 
          left={(props) => <IconButton {...props} icon="sprinkler" size={24} />}
        />
        <Card.Content>
          {mockZones.map((zone, index) => (
            <View key={index} style={styles.zoneItem}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Chip 
                  mode={zone.status === 'Active' ? 'flat' : 'outlined'}
                  textStyle={styles.chipText}
                >
                  {zone.status}
                </Chip>
              </View>
              <Text style={styles.zoneDuration}>Duration: {zone.duration}</Text>
              <ProgressBar 
                progress={zone.progress} 
                color={zone.status === 'Active' ? theme.colors.primary : theme.colors.outline}
                style={styles.progressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Recent Alerts */}
      <Card style={styles.card}>
        <Card.Title 
          title="Recent Alerts" 
          left={(props) => <IconButton {...props} icon="bell-ring" size={24} />}
          right={(props) => (
            <Badge size={20} style={styles.alertBadge}>
              {mockAlerts.length}
            </Badge>
          )}
        />
        <Card.Content>
          {mockAlerts.map((alert, index) => (
            <View key={index} style={styles.alertItem}>
              <IconButton 
                icon={alert.type === 'warning' ? 'alert-circle' : 
                      alert.type === 'info' ? 'information' : 'check-circle'} 
                size={20} 
                iconColor={alert.type === 'warning' ? theme.colors.error : 
                           alert.type === 'info' ? theme.colors.primary : theme.colors.primary}
              />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Weather Widget */}
      <Card style={styles.card}>
        <Card.Title 
          title="Weather Conditions" 
          left={(props) => <IconButton {...props} icon="weather-partly-cloudy" size={24} />}
        />
        <Card.Content>
          <View style={styles.weatherContainer}>
            <View style={styles.weatherMain}>
              <Text style={styles.temperature}>24°C</Text>
              <Text style={styles.weatherDesc}>Partly Cloudy</Text>
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherItem}>
                <IconButton icon="water-percent" size={16} iconColor={theme.colors.primary} />
                <Text style={styles.weatherValue}>65% Humidity</Text>
              </View>
              <View style={styles.weatherItem}>
                <IconButton icon="weather-windy" size={16} iconColor={theme.colors.primary} />
                <Text style={styles.weatherValue}>12 km/h Wind</Text>
              </View>
              <View style={styles.weatherItem}>
                <IconButton icon="weather-rainy" size={16} iconColor={theme.colors.primary} />
                <Text style={styles.weatherValue}>20% Rain</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Navigation Demo */}
      <Card style={styles.card}>
        <Card.Title 
          title="Navigation Demo" 
          left={(props) => <IconButton {...props} icon="navigation" size={24} />}
        />
        <Card.Content>
          <Text style={styles.demoText}>
            This demo shows the main features of the Smart Irrigation app:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• 🔐 Complete Authentication System</Text>
            <Text style={styles.featureItem}>• 🧭 Full Navigation with Bottom Tabs</Text>
            <Text style={styles.featureItem}>• 🗄️ Redux State Management</Text>
            <Text style={styles.featureItem}>• 📊 Real-time Sensor Monitoring</Text>
            <Text style={styles.featureItem}>• 💧 Irrigation Zone Control</Text>
            <Text style={styles.featureItem}>• 🔔 Alert Management System</Text>
            <Text style={styles.featureItem}>• 🌤️ Weather Integration</Text>
            <Text style={styles.featureItem}>• 🎨 Material Design 3 UI</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  authStatus: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  switchContainer: {
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    marginVertical: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sensorItem: {
    marginBottom: 16,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sensorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 10,
  },
  zoneItem: {
    marginBottom: 16,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  zoneDuration: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  alertBadge: {
    backgroundColor: theme.colors.error,
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flex: 1,
  },
  temperature: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  weatherDesc: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  demoText: {
    fontSize: 14,
    marginBottom: 12,
    color: theme.colors.onSurfaceVariant,
  },
  featureList: {
    gap: 4,
  },
  featureItem: {
    fontSize: 13,
    color: theme.colors.onSurface,
  },
});

export default TestDemoScreen;
