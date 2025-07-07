import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, logoutUser } from '../store/slices/authSlice';
import { theme } from '../constants/theme';

const TestScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const { zones } = useAppSelector((state) => state.irrigation);
  const { sensors } = useAppSelector((state) => state.sensors);
  const { alerts } = useAppSelector((state) => state.alerts);

  const handleTestLogin = async () => {
    try {
      await dispatch(loginUser({ 
        email: 'test@example.com', 
        password: 'password123' 
      })).unwrap();
    } catch (error) {
      console.log('Login test - expected to fail:', error);
    }
  };

  const handleTestLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Redux Store Test</Text>
      
      <Card style={styles.card}>
        <Card.Title title="Authentication State" />
        <Card.Content>
          <Text>Is Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</Text>
          <Text>Is Loading: {isLoading ? '⏳ Yes' : '✅ No'}</Text>
          <Text>User: {user?.name || 'No user'}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Store Data" />
        <Card.Content>
          <Text>Irrigation Zones: {zones.length}</Text>
          <Text>Sensors: {sensors.length}</Text>
          <Text>Alerts: {alerts.length}</Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleTestLogin}
          loading={isLoading}
          style={styles.button}
        >
          Test Login
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleTestLogout}
          style={styles.button}
        >
          Test Logout
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    marginVertical: 4,
  },
});

export default TestScreen;
