import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

const SimpleTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="🌱 Smart Irrigation System" />
        <Card.Content>
          <Text style={styles.text}>
            Hello! This is a simple test screen to verify the app is working properly.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => console.log('Button pressed!')}
            style={styles.button}
          >
            Test Button
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});

export default SimpleTestScreen;
