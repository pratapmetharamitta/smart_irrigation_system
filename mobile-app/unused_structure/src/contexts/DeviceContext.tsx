import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {showMessage} from 'react-native-flash-message';
import {deviceApi} from '../services/api/deviceApi';
import {sensorApi} from '../services/api/sensorApi';
import {irrigationApi} from '../services/api/irrigationApi';
import {Device, DeviceStatus, IrrigationCommand} from '../types/device';
import {SensorData, SensorReading} from '../types/sensor';
import {IrrigationEvent} from '../types/irrigation';
import {useAuth} from './AuthContext';
import {useSocket} from './SocketContext';

interface DeviceContextType {
  devices: Device[];
  selectedDevice: Device | null;
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Device management
  fetchDevices: () => Promise<void>;
  selectDevice: (device: Device) => void;
  addDevice: (device: Partial<Device>) => Promise<void>;
  updateDevice: (deviceId: string, updates: Partial<Device>) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  
  // Sensor data
  getSensorData: (deviceId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) => Promise<SensorData[]>;
  getLatestSensorData: (deviceId: string) => Promise<SensorReading | null>;
  getAggregatedData: (deviceId: string, interval: 'hour' | 'day' | 'week') => Promise<any[]>;
  
  // Irrigation control
  controlIrrigation: (deviceId: string, command: IrrigationCommand) => Promise<void>;
  getIrrigationHistory: (deviceId: string, limit?: number) => Promise<IrrigationEvent[]>;
  getIrrigationStats: (deviceId: string, startDate?: Date, endDate?: Date) => Promise<any>;
  
  // Device status
  getDeviceStatus: (deviceId: string) => DeviceStatus;
  refreshDeviceData: (deviceId?: string) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({children}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {isAuthenticated} = useAuth();
  const {socket, isConnected} = useSocket();

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevices();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for real-time device updates
      socket.on('device_status', handleDeviceStatusUpdate);
      socket.on('sensor_data', handleSensorDataUpdate);
      socket.on('irrigation_status', handleIrrigationStatusUpdate);
      socket.on('alert', handleDeviceAlert);

      return () => {
        socket.off('device_status', handleDeviceStatusUpdate);
        socket.off('sensor_data', handleSensorDataUpdate);
        socket.off('irrigation_status', handleIrrigationStatusUpdate);
        socket.off('alert', handleDeviceAlert);
      };
    }
  }, [socket, isConnected]);

  const handleDeviceStatusUpdate = (data: {deviceId: string; data: any}) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.deviceId === data.deviceId
          ? { ...device, ...data.data, lastSeen: new Date() }
          : device
      )
    );

    if (selectedDevice?.deviceId === data.deviceId) {
      setSelectedDevice(prev => prev ? { ...prev, ...data.data, lastSeen: new Date() } : null);
    }
  };

  const handleSensorDataUpdate = (data: {deviceId: string; data: SensorReading}) => {
    // Update device with latest sensor data
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.deviceId === data.deviceId
          ? { ...device, lastSeen: new Date(), latestSensorData: data.data }
          : device
      )
    );

    if (selectedDevice?.deviceId === data.deviceId) {
      setSelectedDevice(prev => 
        prev ? { ...prev, lastSeen: new Date(), latestSensorData: data.data } : null
      );
    }
  };

  const handleIrrigationStatusUpdate = (data: {deviceId: string; data: IrrigationEvent}) => {
    setDevices(prevDevices =>
      prevDevices.map(device =>
        device.deviceId === data.deviceId
          ? { 
              ...device, 
              lastSeen: new Date(),
              irrigationStatus: data.data.action === 'start' ? 'active' : 'inactive'
            }
          : device
      )
    );

    if (selectedDevice?.deviceId === data.deviceId) {
      setSelectedDevice(prev => 
        prev ? { 
          ...prev, 
          lastSeen: new Date(),
          irrigationStatus: data.data.action === 'start' ? 'active' : 'inactive'
        } : null
      );
    }
  };

  const handleDeviceAlert = (data: {deviceId: string; alert: any}) => {
    showMessage({
      message: `Device Alert: ${data.deviceId}`,
      description: data.alert.message || 'Device alert received',
      type: data.alert.severity === 'critical' ? 'danger' : 'warning',
      duration: 5000,
    });
  };

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const response = await deviceApi.getDevices();
      
      if (response.data.success) {
        setDevices(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch devices');
      }
    } catch (error: any) {
      console.error('Error fetching devices:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to fetch devices. Please try again.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectDevice = (device: Device) => {
    setSelectedDevice(device);
    
    // Join device-specific socket room for real-time updates
    if (socket && isConnected) {
      socket.emit('join-device', device.deviceId);
    }
  };

  const addDevice = async (deviceData: Partial<Device>) => {
    try {
      setIsLoading(true);
      const response = await deviceApi.addDevice(deviceData);
      
      if (response.data.success) {
        const newDevice = response.data.data;
        setDevices(prev => [...prev, newDevice]);
        
        showMessage({
          message: 'Device Added',
          description: `${newDevice.name} has been added successfully.`,
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Failed to add device');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add device';
      showMessage({
        message: 'Error',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    try {
      setIsLoading(true);
      const response = await deviceApi.updateDevice(deviceId, updates);
      
      if (response.data.success) {
        const updatedDevice = response.data.data;
        setDevices(prev =>
          prev.map(device =>
            device.deviceId === deviceId ? updatedDevice : device
          )
        );
        
        if (selectedDevice?.deviceId === deviceId) {
          setSelectedDevice(updatedDevice);
        }
        
        showMessage({
          message: 'Device Updated',
          description: 'Device has been updated successfully.',
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Failed to update device');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update device';
      showMessage({
        message: 'Error',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      setIsLoading(true);
      const response = await deviceApi.removeDevice(deviceId);
      
      if (response.data.success) {
        setDevices(prev => prev.filter(device => device.deviceId !== deviceId));
        
        if (selectedDevice?.deviceId === deviceId) {
          setSelectedDevice(null);
        }
        
        showMessage({
          message: 'Device Removed',
          description: 'Device has been removed successfully.',
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Failed to remove device');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove device';
      showMessage({
        message: 'Error',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getSensorData = async (
    deviceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<SensorData[]> => {
    try {
      const response = await sensorApi.getSensorData(deviceId, options);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch sensor data');
      }
    } catch (error: any) {
      console.error('Error fetching sensor data:', error);
      showMessage({
        message: 'Error',
        description: 'Failed to fetch sensor data.',
        type: 'danger',
      });
      return [];
    }
  };

  const getLatestSensorData = async (deviceId: string): Promise<SensorReading | null> => {
    try {
      const response = await sensorApi.getLatestSensorData(deviceId);
      if (response.data.success) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching latest sensor data:', error);
      return null;
    }
  };

  const getAggregatedData = async (
    deviceId: string,
    interval: 'hour' | 'day' | 'week'
  ): Promise<any[]> => {
    try {
      const response = await sensorApi.getAggregatedData(deviceId, interval);
      if (response.data.success) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching aggregated data:', error);
      return [];
    }
  };

  const controlIrrigation = async (deviceId: string, command: IrrigationCommand) => {
    try {
      const response = await irrigationApi.controlIrrigation(deviceId, command);
      
      if (response.data.success) {
        showMessage({
          message: 'Irrigation Command Sent',
          description: `Irrigation ${command.action} command sent successfully.`,
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Failed to send irrigation command');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to control irrigation';
      showMessage({
        message: 'Error',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    }
  };

  const getIrrigationHistory = async (deviceId: string, limit = 50): Promise<IrrigationEvent[]> => {
    try {
      const response = await irrigationApi.getIrrigationHistory(deviceId, limit);
      if (response.data.success) {
        return response.data.data;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error fetching irrigation history:', error);
      return [];
    }
  };

  const getIrrigationStats = async (
    deviceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> => {
    try {
      const response = await irrigationApi.getIrrigationStats(deviceId, startDate, endDate);
      if (response.data.success) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching irrigation stats:', error);
      return null;
    }
  };

  const getDeviceStatus = (deviceId: string): DeviceStatus => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) return 'offline';
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return device.lastSeen && new Date(device.lastSeen) > fiveMinutesAgo 
      ? device.status || 'online' 
      : 'offline';
  };

  const refreshDeviceData = async (deviceId?: string) => {
    try {
      setIsRefreshing(true);
      
      if (deviceId) {
        // Refresh specific device
        const response = await deviceApi.getDevice(deviceId);
        if (response.data.success) {
          const updatedDevice = response.data.data;
          setDevices(prev =>
            prev.map(device =>
              device.deviceId === deviceId ? updatedDevice : device
            )
          );
          
          if (selectedDevice?.deviceId === deviceId) {
            setSelectedDevice(updatedDevice);
          }
        }
      } else {
        // Refresh all devices
        await fetchDevices();
      }
    } catch (error: any) {
      console.error('Error refreshing device data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const value: DeviceContextType = {
    devices,
    selectedDevice,
    isLoading,
    isRefreshing,
    fetchDevices,
    selectDevice,
    addDevice,
    updateDevice,
    removeDevice,
    getSensorData,
    getLatestSensorData,
    getAggregatedData,
    controlIrrigation,
    getIrrigationHistory,
    getIrrigationStats,
    getDeviceStatus,
    refreshDeviceData,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
