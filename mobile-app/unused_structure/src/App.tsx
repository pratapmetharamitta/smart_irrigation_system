import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DeviceProvider } from './contexts/DeviceContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Navigation
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <DeviceProvider>
              <SocketProvider>
                <NotificationProvider>
                  <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                  <AppNavigator />
                </NotificationProvider>
              </SocketProvider>
            </DeviceProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const initializeApp = async () => {
    try {
      // Configure Flipper in development
      if (__DEV__) {
        configureFlipper();
      }

      // Request necessary permissions
      await requestPermissions();

      // Initialize push notifications
      await initializeNotifications();

      // Hide splash screen
      if (Platform.OS === 'android') {
        SplashScreen.hide();
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => initializeApp(),
          },
        ],
      );
    }
  };

  const handleAppStateChange = (nextAppState: string) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('App has come to the foreground');
    }
    setAppState(nextAppState);
  };

  if (!isInitialized) {
    return <LoadingOverlay visible={true} text="Initializing Smart Irrigation..." />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <PaperProvider theme={theme}>
                <AuthProvider>
                  <DeviceProvider>
                    <SocketProvider>
                      <NotificationProvider>
                        <StatusBar
                          barStyle="light-content"
                          backgroundColor={theme.colors.primary}
                          translucent={false}
                        />
                        <NavigationContainer>
                          <RootNavigator />
                        </NavigationContainer>
                        <FlashMessage position="top" />
                      </NotificationProvider>
                    </SocketProvider>
                  </DeviceProvider>
                </AuthProvider>
              </PaperProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
