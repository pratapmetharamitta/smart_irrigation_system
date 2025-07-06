import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const DeviceDetailScreen = ({ route }) => {
  const { colors } = useTheme();
  const { deviceId } = route.params;

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
      <Text style={styles.title}>Device Detail Screen</Text>
      <Text style={styles.subtitle}>Device ID: {deviceId}</Text>
    </SafeAreaView>
  );
};

export default DeviceDetailScreen;
