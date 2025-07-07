import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Text,
  Button,
  Surface,
  IconButton,
  Chip,
  Badge
} from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '../../store';
import { theme } from '../../constants/theme';

const DashboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { zones } = useAppSelector((state) => state.irrigation);
  const { sensors } = useAppSelector((state) => state.sensors);
  const { alerts } = useAppSelector((state) => state.alerts);
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const activeZones = zones.filter(zone => zone.isActive);
  const activeSensors = sensors.filter(sensor => sensor.isActive);
  const unreadAlerts = alerts.filter(alert => !alert.isRead);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Title style={styles.welcomeTitle}>Welcome back!</Title>
            <Paragraph style={styles.welcomeSubtitle}>
              {user?.name || 'Smart Farmer'}
            </Paragraph>
          </View>
          <IconButton 
            icon="bell" 
            size={24} 
            onPress={() => {}} // Navigate to alerts
            style={styles.bellIcon}
          />
          {unreadAlerts.length > 0 && (
            <Badge style={styles.badge} size={20}>
              {unreadAlerts.length}
            </Badge>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Surface style={styles.statCard}>
          <IconButton icon="water" size={24} iconColor={theme.colors.primary} />
          <Text style={styles.statNumber}>{activeZones.length}</Text>
          <Text style={styles.statLabel}>Active Zones</Text>
        </Surface>
        
        <Surface style={styles.statCard}>
          <IconButton icon="thermometer" size={24} iconColor={theme.colors.secondary} />
          <Text style={styles.statNumber}>{activeSensors.length}</Text>
          <Text style={styles.statLabel}>Sensors</Text>
        </Surface>
        
        <Surface style={styles.statCard}>
          <IconButton icon="alert-circle" size={24} iconColor={theme.colors.error} />
          <Text style={styles.statNumber}>{unreadAlerts.length}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </Surface>
      </View>

      {/* Current Weather */}
      <Card style={styles.card}>
        <Card.Title 
          title="Current Weather" 
          subtitle="Real-time conditions"
          left={(props) => <IconButton {...props} icon="weather-sunny" size={24} />}
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
                <Text style={styles.weatherValue}>65%</Text>
              </View>
              <View style={styles.weatherItem}>
                <IconButton icon="weather-windy" size={16} iconColor={theme.colors.primary} />
                <Text style={styles.weatherValue}>12 km/h</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Active Irrigation */}
      <Card style={styles.card}>
        <Card.Title 
          title="Active Irrigation" 
          subtitle={`${activeZones.length} zone(s) running`}
          left={(props) => <IconButton {...props} icon="water" size={24} />}
          right={(props) => (
            <Button mode="text" onPress={() => {}}>
              View All
            </Button>
          )}
        />
        <Card.Content>
          {activeZones.length === 0 ? (
            <Paragraph>No irrigation zones are currently active.</Paragraph>
          ) : (
            <View style={styles.zonesContainer}>
              {activeZones.slice(0, 3).map((zone, index) => (
                <View key={zone.id} style={styles.zoneItem}>
                  <View style={styles.zoneInfo}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={styles.zoneStatus}>Running • {zone.duration}min remaining</Text>
                  </View>
                  <Chip mode="outlined" compact>
                    {zone.cropType}
                  </Chip>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recent Alerts */}
      <Card style={styles.card}>
        <Card.Title 
          title="Recent Alerts" 
          subtitle={`${unreadAlerts.length} unread`}
          left={(props) => <IconButton {...props} icon="bell" size={24} />}
          right={(props) => (
            <Button mode="text" onPress={() => {}}>
              View All
            </Button>
          )}
        />
        <Card.Content>
          {unreadAlerts.length === 0 ? (
            <Paragraph>No new alerts.</Paragraph>
          ) : (
            <View style={styles.alertsContainer}>
              {unreadAlerts.slice(0, 3).map((alert, index) => (
                <View key={alert.id} style={styles.alertItem}>
                  <IconButton 
                    icon={alert.type === 'warning' ? 'alert-circle' : 'information'} 
                    size={20} 
                    iconColor={alert.type === 'warning' ? theme.colors.error : theme.colors.primary}
                  />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertTime}>{alert.timestamp.toLocaleTimeString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Title 
          title="Quick Actions" 
          left={(props) => <IconButton {...props} icon="flash" size={24} />}
        />
        <Card.Content>
          <View style={styles.actionsContainer}>
            <Button 
              mode="contained" 
              icon="water" 
              style={styles.actionButton}
              onPress={() => {}}
            >
              Start Irrigation
            </Button>
            <Button 
              mode="outlined" 
              icon="chart-line" 
              style={styles.actionButton}
              onPress={() => {}}
            >
              View Reports
            </Button>
            <Button 
              mode="outlined" 
              icon="cog" 
              style={styles.actionButton}
              onPress={() => {}}
            >
              Settings
            </Button>
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
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  bellIcon: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: theme.colors.error,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  weatherDesc: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  weatherDetails: {
    alignItems: 'flex-end',
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  weatherValue: {
    marginLeft: 4,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  zonesContainer: {
    gap: 12,
  },
  zoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  zoneStatus: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  alertsContainer: {
    gap: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  alertTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default DashboardScreen;
