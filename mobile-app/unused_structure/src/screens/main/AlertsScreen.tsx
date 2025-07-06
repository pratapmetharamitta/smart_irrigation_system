import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const AlertsScreen = () => {
  const { colors } = useTheme();

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
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Alerts Screen</Text>
    </SafeAreaView>
  );
};

export default AlertsScreen;
