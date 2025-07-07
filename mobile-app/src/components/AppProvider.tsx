import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import { store, persistor } from '../store';
import { theme } from '../constants/theme';
import { RootNavigator } from '../navigation/RootNavigator';

interface AppProviderProps {
  children?: React.ReactNode;
}

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar style="auto" />
            <RootNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};
