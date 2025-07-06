import ApiService from './ApiService';
import { SensorData, SensorDataQuery, ChartData, PaginatedResponse } from '../types/api';

class SensorService {
  async getSensorData(query: SensorDataQuery): Promise<PaginatedResponse<SensorData[]>> {
    const params = new URLSearchParams();
    
    if (query.deviceId) params.append('deviceId', query.deviceId);
    if (query.sensorType) params.append('sensorType', query.sensorType);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.aggregation) params.append('aggregation', query.aggregation);
    
    const response = await ApiService.get<PaginatedResponse<SensorData[]>>(`/sensors/data?${params.toString()}`);
    return response.data;
  }

  async getLatestSensorData(deviceId: string, sensorType?: string): Promise<SensorData[]> {
    const params = new URLSearchParams();
    if (sensorType) params.append('sensorType', sensorType);
    
    const response = await ApiService.get<SensorData[]>(`/sensors/data/${deviceId}/latest?${params.toString()}`);
    return response.data;
  }

  async getSensorHistory(deviceId: string, sensorType: string, hours: number = 24): Promise<SensorData[]> {
    const response = await ApiService.get<SensorData[]>(`/sensors/data/${deviceId}/${sensorType}/history?hours=${hours}`);
    return response.data;
  }

  async getSensorChartData(deviceId: string, sensorType: string, period: 'hour' | 'day' | 'week' | 'month'): Promise<ChartData> {
    const response = await ApiService.get<ChartData>(`/sensors/data/${deviceId}/${sensorType}/chart?period=${period}`);
    return response.data;
  }

  async getSensorStats(deviceId: string, sensorType: string): Promise<{
    min: number;
    max: number;
    avg: number;
    current: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const response = await ApiService.get(`/sensors/data/${deviceId}/${sensorType}/stats`);
    return response.data as any;
  }

  async exportSensorData(deviceId: string, sensorType: string, format: 'csv' | 'json' | 'xlsx', startDate?: string, endDate?: string): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await ApiService.get(`/sensors/data/${deviceId}/${sensorType}/export?${params.toString()}`);
    return response.data as any;
  }

  async getSensorAlerts(deviceId: string, sensorType?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (sensorType) params.append('sensorType', sensorType);
    
    const response = await ApiService.get(`/sensors/alerts/${deviceId}?${params.toString()}`);
    return response.data as any;
  }

  async createSensorAlert(deviceId: string, sensorType: string, condition: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    message: string;
  }): Promise<any> {
    const response = await ApiService.post(`/sensors/alerts/${deviceId}/${sensorType}`, condition);
    return response.data;
  }

  async updateSensorAlert(alertId: string, condition: {
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    message: string;
  }): Promise<any> {
    const response = await ApiService.put(`/sensors/alerts/${alertId}`, condition);
    return response.data;
  }

  async deleteSensorAlert(alertId: string): Promise<void> {
    await ApiService.delete(`/sensors/alerts/${alertId}`);
  }

  async calibrateSensor(deviceId: string, sensorType: string, calibrationData: {
    referenceValue: number;
    currentValue: number;
    notes?: string;
  }): Promise<void> {
    await ApiService.post(`/sensors/${deviceId}/${sensorType}/calibrate`, calibrationData);
  }

  async getSensorTypes(): Promise<string[]> {
    const response = await ApiService.get<string[]>('/sensors/types');
    return response.data;
  }

  async getSensorUnits(sensorType: string): Promise<string[]> {
    const response = await ApiService.get<string[]>(`/sensors/types/${sensorType}/units`);
    return response.data;
  }

  async getAggregatedData(deviceIds: string[], sensorType: string, aggregation: 'avg' | 'sum' | 'min' | 'max', period: 'hour' | 'day' | 'week' | 'month'): Promise<ChartData> {
    const response = await ApiService.post<ChartData>('/sensors/data/aggregate', {
      deviceIds,
      sensorType,
      aggregation,
      period
    });
    return response.data;
  }

  async compareSensorData(deviceIds: string[], sensorType: string, period: 'hour' | 'day' | 'week' | 'month'): Promise<ChartData> {
    const response = await ApiService.post<ChartData>('/sensors/data/compare', {
      deviceIds,
      sensorType,
      period
    });
    return response.data;
  }
}

export default new SensorService();
