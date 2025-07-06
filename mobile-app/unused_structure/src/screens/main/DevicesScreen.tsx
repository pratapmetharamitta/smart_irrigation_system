import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useDevice } from '../../contexts/DeviceContext';

const DevicesScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { devices, isLoading, fetchDevices } = useDevice();

  useEffect(() => {
    fetchDevices();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDevices().finally(() => setRefreshing(false));
  }, [fetchDevices]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return colors.success;
      case 'offline':
        return colors.error;
      case 'maintenance':
        return colors.warning;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return 'wifi';
      case 'offline':
        return 'wifi-off';
      case 'maintenance':
        return 'build';
      default:
        return 'help';
    }
  };

  const renderDevice = ({ item }) => (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => navigation.navigate('DeviceDetail', { deviceId: item.id })}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIcon}>
          <Icon name="device-hub" size={24} color={colors.primary} />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceLocation}>{item.location}</Text>
        </View>
        <View style={styles.deviceStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <Icon name={getStatusIcon(item.status)} size={20} color={getStatusColor(item.status)} />
        </View>
      </View>
      
      <View style={styles.deviceMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Battery</Text>
          <Text style={styles.metricValue}>{item.battery}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Signal</Text>
          <Text style={styles.metricValue}>{item.signal}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Last Seen</Text>
          <Text style={styles.metricValue}>{item.lastSeen}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    deviceCard: {
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
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    deviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    deviceLocation: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    deviceStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    deviceMetrics: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    metric: {
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  const handleAddDevice = () => {
    Alert.alert(
      'Add Device',
      'Would you like to add a new device?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => console.log('Add device') },
      ]
    );
  };

  if (!devices || devices.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Devices</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
            <Icon name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Icon name="devices" size={40} color={colors.text.secondary} />
          </View>
          <Text style={styles.emptyTitle}>No Devices Found</Text>
          <Text style={styles.emptySubtitle}>
            Add your first IoT device to start monitoring your irrigation system.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Devices</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
          <Icon name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default DevicesScreen;
