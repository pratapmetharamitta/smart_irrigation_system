import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph } from 'react-native-paper';
import { theme } from '../../constants/theme';

const SensorsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Title style={styles.title}>Sensor Monitoring</Title>
      <Paragraph style={styles.subtitle}>
        Monitor your soil, weather, and environmental sensors
      </Paragraph>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default SensorsScreen;
