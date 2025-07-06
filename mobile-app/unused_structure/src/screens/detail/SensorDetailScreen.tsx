import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const SensorDetailScreen = ({ route }) => {
  const { colors } = useTheme();
  const { sensorId } = route.params;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text.secondary,
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sensor Detail Screen</Text>
      <Text style={styles.subtitle}>Sensor ID: {sensorId}</Text>
    </SafeAreaView>
  );
};

export default SensorDetailScreen;
