import ApiService from './ApiService';
import { LoginRequest, RegisterRequest, User, AuthResponse } from '../types/api';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data.token) {
      await this.saveAuthToken(response.data.token);
    }
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>('/auth/register', userData);
    
    if (response.success && response.data.token) {
      await this.saveAuthToken(response.data.token);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await ApiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.removeAuthToken();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>('/auth/refresh');
    
    if (response.success && response.data.token) {
      await this.saveAuthToken(response.data.token);
    }
    
    return response.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await ApiService.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await ApiService.post('/auth/reset-password', { token, password });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await ApiService.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async getProfile(): Promise<User> {
    const response = await ApiService.get<User>('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await ApiService.put<User>('/auth/profile', userData);
    return response.data;
  }

  async verifyEmail(token: string): Promise<void> {
    await ApiService.post('/auth/verify-email', { token });
  }

  async resendVerificationEmail(): Promise<void> {
    await ApiService.post('/auth/resend-verification');
  }

  private async saveAuthToken(token: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  private async removeAuthToken(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}

export default new AuthService();
