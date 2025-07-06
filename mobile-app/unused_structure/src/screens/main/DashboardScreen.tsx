import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { useDevice } from '../../contexts/DeviceContext';
import { useSocket } from '../../contexts/SocketContext';

const { width: screenWidth } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  
  const { colors } = useTheme();
  const { devices, sensors, isLoading, refreshDevices } = useDevice();
  const { isConnected } = useSocket();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refreshDevices().finally(() => setRefreshing(false));
  }, [refreshDevices]);

  // Mock data for charts
  const chartData = {
    labels: ['6h', '12h', '18h', '24h'],
    datasets: [
      {
        data: [65, 72, 68, 75],
        color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const stats = [
    {
      title: 'Active Devices',
      value: devices?.filter(d => d.status === 'online').length || 0,
      total: devices?.length || 0,
      icon: 'devices',
      color: colors.primary,
      onPress: () => navigation.navigate('Devices'),
    },
    {
      title: 'Soil Moisture',
      value: '72%',
      subtitle: 'Optimal',
      icon: 'water-drop',
      color: colors.success,
      onPress: () => navigation.navigate('Sensors'),
    },
    {
      title: 'Water Usage',
      value: '245L',
      subtitle: 'Today',
      icon: 'opacity',
      color: colors.info,
      onPress: () => navigation.navigate('Irrigation'),
    },
    {
      title: 'Alerts',
      value: '3',
      subtitle: 'Active',
      icon: 'warning',
      color: colors.warning,
      onPress: () => navigation.navigate('Alerts'),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Irrigation Started',
      subtitle: 'Zone A - Garden',
      time: '10 min ago',
      icon: 'water-drop',
      color: colors.primary,
    },
    {
      id: 2,
      title: 'Low Soil Moisture',
      subtitle: 'Zone B - Vegetables',
      time: '25 min ago',
      icon: 'warning',
      color: colors.warning,
    },
    {
      id: 3,
      title: 'Device Connected',
      subtitle: 'ESP32-Garden-01',
      time: '1 hour ago',
      icon: 'wifi',
      color: colors.success,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 20,
      paddingTop: 10,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    subGreeting: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 4,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    connectionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statTitle: {
      fontSize: 12,
      color: colors.text.secondary,
      fontWeight: '600',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 4,
    },
    statSubtitle: {
      fontSize: 10,
      color: colors.text.secondary,
    },
    chartContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    timeRangeContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 2,
    },
    timeRangeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    timeRangeButtonActive: {
      backgroundColor: colors.primary,
    },
    timeRangeText: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    timeRangeTextActive: {
      color: colors.white,
    },
    activitiesContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 16,
    },
    activityCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    activitySubtitle: {
      fontSize: 12,
      color: colors.text.secondary,
    },
    activityTime: {
      fontSize: 12,
      color: colors.text.secondary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good Morning</Text>
              <Text style={styles.subGreeting}>Your garden is looking great!</Text>
            </View>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.connectionDot,
                  { backgroundColor: isConnected ? colors.success : colors.error },
                ]}
              />
              <Text
                style={[
                  styles.connectionText,
                  { color: isConnected ? colors.success : colors.error },
                ]}
              >
                {isConnected ? 'Connected' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.statCard}
              onPress={stat.onPress}
            >
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <View style={[styles.activityIcon, { backgroundColor: stat.color }]}>
                  <Icon name={stat.icon} size={20} color={colors.white} />
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              {stat.subtitle && (
                <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Soil Moisture Trend</Text>
              <View style={styles.timeRangeContainer}>
                {['6h', '12h', '24h', '7d'].map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[
                      styles.timeRangeButton,
                      selectedTimeRange === range && styles.timeRangeButtonActive,
                    ]}
                    onPress={() => setSelectedTimeRange(range)}
                  >
                    <Text
                      style={[
                        styles.timeRangeText,
                        selectedTimeRange === range && styles.timeRangeTextActive,
                      ]}
                    >
                      {range}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <LineChart
              data={chartData}
              width={screenWidth - 72}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color }]}>
                <Icon name={activity.icon} size={20} color={colors.white} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
