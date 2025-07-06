import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {showMessage} from 'react-native-flash-message';
import {authApi} from '../services/api/authApi';
import {User, LoginCredentials, RegisterCredentials} from '../types/auth';
import {ApiResponse} from '../types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Validate token with backend
        try {
          const response = await authApi.getProfile();
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            // Token is invalid, clear auth data
            await clearAuthData();
          }
        } catch (error) {
          // Token is invalid or expired, clear auth data
          await clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const storeAuthData = async (authToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      if (response.data.success) {
        const {token: authToken, user: userData} = response.data.data;
        await storeAuthData(authToken, userData);
        
        showMessage({
          message: 'Login Successful',
          description: `Welcome back, ${userData.firstName || userData.username}!`,
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      showMessage({
        message: 'Login Failed',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(credentials);
      
      if (response.data.success) {
        const {token: authToken, user: userData} = response.data.data;
        await storeAuthData(authToken, userData);
        
        showMessage({
          message: 'Registration Successful',
          description: `Welcome to Smart Irrigation, ${userData.firstName || userData.username}!`,
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      showMessage({
        message: 'Registration Failed',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await clearAuthData();
      
      showMessage({
        message: 'Logged Out',
        description: 'You have been successfully logged out.',
        type: 'info',
      });
    } catch (error) {
      console.error('Error during logout:', error);
      showMessage({
        message: 'Logout Error',
        description: 'There was an error logging out. Please try again.',
        type: 'warning',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      const response = await authApi.updateProfile(userData);
      
      if (response.data.success) {
        const updatedUser = response.data.data.user;
        await storeAuthData(token!, updatedUser);
        
        showMessage({
          message: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      showMessage({
        message: 'Update Failed',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.changePassword(currentPassword, newPassword);
      
      if (response.data.success) {
        showMessage({
          message: 'Password Changed',
          description: 'Your password has been changed successfully.',
          type: 'success',
        });
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      showMessage({
        message: 'Password Change Failed',
        description: errorMessage,
        type: 'danger',
      });
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
