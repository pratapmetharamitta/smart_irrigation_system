import ApiService from './ApiService';
import { IrrigationEvent, IrrigationSchedule, PaginatedResponse } from '../types/api';

class IrrigationService {
  async getIrrigationEvents(deviceId?: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<IrrigationEvent[]>> {
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await ApiService.get<PaginatedResponse<IrrigationEvent[]>>(`/irrigation/events?${params.toString()}`);
    return response.data;
  }

  async getIrrigationEvent(eventId: string): Promise<IrrigationEvent> {
    const response = await ApiService.get<IrrigationEvent>(`/irrigation/events/${eventId}`);
    return response.data;
  }

  async startIrrigation(deviceId: string, duration: number, waterAmount?: number): Promise<IrrigationEvent> {
    const response = await ApiService.post<IrrigationEvent>(`/irrigation/start`, {
      deviceId,
      duration,
      waterAmount
    });
    return response.data;
  }

  async stopIrrigation(eventId: string): Promise<IrrigationEvent> {
    const response = await ApiService.post<IrrigationEvent>(`/irrigation/stop/${eventId}`);
    return response.data;
  }

  async pauseIrrigation(eventId: string): Promise<IrrigationEvent> {
    const response = await ApiService.post<IrrigationEvent>(`/irrigation/pause/${eventId}`);
    return response.data;
  }

  async resumeIrrigation(eventId: string): Promise<IrrigationEvent> {
    const response = await ApiService.post<IrrigationEvent>(`/irrigation/resume/${eventId}`);
    return response.data;
  }

  async getIrrigationSchedules(deviceId?: string): Promise<IrrigationSchedule[]> {
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    
    const response = await ApiService.get<IrrigationSchedule[]>(`/irrigation/schedules?${params.toString()}`);
    return response.data;
  }

  async getIrrigationSchedule(scheduleId: string): Promise<IrrigationSchedule> {
    const response = await ApiService.get<IrrigationSchedule>(`/irrigation/schedules/${scheduleId}`);
    return response.data;
  }

  async createIrrigationSchedule(scheduleData: Partial<IrrigationSchedule>): Promise<IrrigationSchedule> {
    const response = await ApiService.post<IrrigationSchedule>('/irrigation/schedules', scheduleData);
    return response.data;
  }

  async updateIrrigationSchedule(scheduleId: string, scheduleData: Partial<IrrigationSchedule>): Promise<IrrigationSchedule> {
    const response = await ApiService.put<IrrigationSchedule>(`/irrigation/schedules/${scheduleId}`, scheduleData);
    return response.data;
  }

  async deleteIrrigationSchedule(scheduleId: string): Promise<void> {
    await ApiService.delete(`/irrigation/schedules/${scheduleId}`);
  }

  async enableSchedule(scheduleId: string): Promise<IrrigationSchedule> {
    const response = await ApiService.post<IrrigationSchedule>(`/irrigation/schedules/${scheduleId}/enable`);
    return response.data;
  }

  async disableSchedule(scheduleId: string): Promise<IrrigationSchedule> {
    const response = await ApiService.post<IrrigationSchedule>(`/irrigation/schedules/${scheduleId}/disable`);
    return response.data;
  }

  async getIrrigationHistory(deviceId: string, days: number = 30): Promise<IrrigationEvent[]> {
    const response = await ApiService.get<IrrigationEvent[]>(`/irrigation/history/${deviceId}?days=${days}`);
    return response.data;
  }

  async getIrrigationStats(deviceId: string, period: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalEvents: number;
    totalDuration: number;
    totalWaterUsage: number;
    avgDuration: number;
    avgWaterUsage: number;
    efficiency: number;
  }> {
    const response = await ApiService.get(`/irrigation/stats/${deviceId}?period=${period}`);
    return response.data as any;
  }

  async getWaterUsage(deviceId?: string, period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<{
    labels: string[];
    data: number[];
    total: number;
    average: number;
  }> {
    const params = new URLSearchParams();
    if (deviceId) params.append('deviceId', deviceId);
    params.append('period', period);
    
    const response = await ApiService.get(`/irrigation/water-usage?${params.toString()}`);
    return response.data as any;
  }

  async getIrrigationEfficiency(deviceId: string): Promise<{
    score: number;
    factors: {
      timing: number;
      duration: number;
      frequency: number;
      conditions: number;
    };
    recommendations: string[];
  }> {
    const response = await ApiService.get(`/irrigation/efficiency/${deviceId}`);
    return response.data as any;
  }

  async getNextScheduledIrrigation(deviceId: string): Promise<{
    scheduleId: string;
    scheduleName: string;
    nextRun: string;
    duration: number;
    waterAmount?: number;
  } | null> {
    const response = await ApiService.get(`/irrigation/next-scheduled/${deviceId}`);
    return response.data as any;
  }

  async simulateIrrigation(deviceId: string, conditions: {
    soilMoisture: number;
    temperature: number;
    humidity: number;
    weather: string;
  }): Promise<{
    recommended: boolean;
    confidence: number;
    duration: number;
    waterAmount: number;
    reasoning: string;
  }> {
    const response = await ApiService.post(`/irrigation/simulate/${deviceId}`, conditions);
    return response.data as any;
  }

  async getIrrigationZones(deviceId: string): Promise<{
    id: string;
    name: string;
    area: number;
    cropType: string;
    soilType: string;
    active: boolean;
  }[]> {
    const response = await ApiService.get(`/irrigation/zones/${deviceId}`);
    return response.data as any;
  }

  async updateIrrigationZone(deviceId: string, zoneId: string, zoneData: {
    name?: string;
    area?: number;
    cropType?: string;
    soilType?: string;
    active?: boolean;
  }): Promise<void> {
    await ApiService.put(`/irrigation/zones/${deviceId}/${zoneId}`, zoneData);
  }
}

export default new IrrigationService();
