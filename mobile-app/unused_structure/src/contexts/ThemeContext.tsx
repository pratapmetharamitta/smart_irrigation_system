import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  colors: Colors;
}

interface Colors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  card: string;
  placeholder: string;
  disabled: string;
  accent: string;
}

const lightColors: Colors = {
  primary: '#2E7D32',
  secondary: '#4CAF50',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  info: '#1976D2',
  card: '#FFFFFF',
  placeholder: '#9E9E9E',
  disabled: '#BDBDBD',
  accent: '#81C784',
};

const darkColors: Colors = {
  primary: '#4CAF50',
  secondary: '#81C784',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#CF6679',
  success: '#4CAF50',
  warning: '#FFB74D',
  info: '#64B5F6',
  card: '#1E1E1E',
  placeholder: '#757575',
  disabled: '#444444',
  accent: '#81C784',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    updateStatusBar();
  }, [isDark]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
      updateTheme(savedTheme as ThemeType || 'system');
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateTheme = (newTheme: ThemeType) => {
    if (newTheme === 'system') {
      // In a real app, you would detect system theme
      // For now, we'll default to light
      setIsDark(false);
    } else {
      setIsDark(newTheme === 'dark');
    }
  };

  const updateStatusBar = () => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      updateTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
