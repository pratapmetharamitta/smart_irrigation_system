import ApiService from './ApiService';
import { Device, DeviceConfiguration, PaginatedResponse } from '../types/api';

class DeviceService {
  async getDevices(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Device[]>> {
    const response = await ApiService.get<PaginatedResponse<Device[]>>(`/devices?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getDevice(deviceId: string): Promise<Device> {
    const response = await ApiService.get<Device>(`/devices/${deviceId}`);
    return response.data;
  }

  async createDevice(deviceData: Partial<Device>): Promise<Device> {
    const response = await ApiService.post<Device>('/devices', deviceData);
    return response.data;
  }

  async updateDevice(deviceId: string, deviceData: Partial<Device>): Promise<Device> {
    const response = await ApiService.put<Device>(`/devices/${deviceId}`, deviceData);
    return response.data;
  }

  async deleteDevice(deviceId: string): Promise<void> {
    await ApiService.delete(`/devices/${deviceId}`);
  }

  async getDeviceConfiguration(deviceId: string): Promise<DeviceConfiguration> {
    const response = await ApiService.get<DeviceConfiguration>(`/devices/${deviceId}/configuration`);
    return response.data;
  }

  async updateDeviceConfiguration(deviceId: string, configuration: DeviceConfiguration): Promise<DeviceConfiguration> {
    const response = await ApiService.put<DeviceConfiguration>(`/devices/${deviceId}/configuration`, configuration);
    return response.data;
  }

  async restartDevice(deviceId: string): Promise<void> {
    await ApiService.post(`/devices/${deviceId}/restart`);
  }

  async updateFirmware(deviceId: string, firmwareFile: any): Promise<void> {
    await ApiService.uploadFile(`/devices/${deviceId}/firmware`, firmwareFile);
  }

  async getDeviceStatus(deviceId: string): Promise<{
    status: 'online' | 'offline' | 'maintenance';
    lastSeen: string;
    battery?: number;
    rssi?: number;
  }> {
    const response = await ApiService.get(`/devices/${deviceId}/status`);
    return response.data;
  }

  async calibrateSensor(deviceId: string, sensorType: string, calibrationData: any): Promise<void> {
    await ApiService.post(`/devices/${deviceId}/sensors/${sensorType}/calibrate`, calibrationData);
  }

  async testActuator(deviceId: string, actuatorType: string, duration: number): Promise<void> {
    await ApiService.post(`/devices/${deviceId}/actuators/${actuatorType}/test`, { duration });
  }

  async getDeviceLogs(deviceId: string, level?: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (limit) params.append('limit', limit.toString());
    
    const response = await ApiService.get(`/devices/${deviceId}/logs?${params.toString()}`);
    return response.data;
  }

  async exportDeviceData(deviceId: string, format: 'csv' | 'json' | 'xlsx'): Promise<Blob> {
    const response = await ApiService.get(`/devices/${deviceId}/export?format=${format}`);
    return response.data;
  }

  async searchDevices(query: string): Promise<Device[]> {
    const response = await ApiService.get<Device[]>(`/devices/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getDevicesByLocation(latitude: number, longitude: number, radius: number): Promise<Device[]> {
    const response = await ApiService.get<Device[]>(`/devices/location?lat=${latitude}&lng=${longitude}&radius=${radius}`);
    return response.data;
  }

  async getDevicesByStatus(status: 'online' | 'offline' | 'maintenance'): Promise<Device[]> {
    const response = await ApiService.get<Device[]>(`/devices/status/${status}`);
    return response.data;
  }
}

export default new DeviceService();
