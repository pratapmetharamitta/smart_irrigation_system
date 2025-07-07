import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Card, 
  Title, 
  Paragraph,
  IconButton,
  HelperText,
  Checkbox
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser } from '../../store/slices/authSlice';
import { theme } from '../../constants/theme';
import config from '../../constants/config';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await dispatch(loginUser({ email, password, rememberMe })).unwrap();
      // Navigation will be handled by the AppProvider based on auth state
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // This will be implemented when biometric authentication is added
      Alert.alert('Biometric Login', 'Feature coming soon!');
    } catch (error) {
      Alert.alert('Biometric Login Failed', 'Please try again');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <IconButton 
            icon="water" 
            size={60} 
            iconColor={theme.colors.primary}
          />
          <Title style={styles.title}>Smart Irrigation</Title>
          <Paragraph style={styles.subtitle}>
            Welcome back! Please sign in to your account.
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              error={!!emailError}
              left={<TextInput.Icon icon="email" />}
            />
            <HelperText type="error" visible={!!emailError}>
              {emailError}
            </HelperText>

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              error={!!passwordError}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!passwordError}>
              {passwordError}
            </HelperText>

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={rememberMe ? 'checked' : 'unchecked'}
                onPress={() => setRememberMe(!rememberMe)}
              />
              <Text style={styles.checkboxText}>Remember me</Text>
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              style={styles.biometricButton}
              contentStyle={styles.buttonContent}
              icon="fingerprint"
            >
              Use Biometric
            </Button>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>or</Text>
            </View>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword' as never)}
              style={styles.forgotButton}
            >
              Forgot Password?
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('Register' as never)}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  input: {
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 16,
  },
  loginButton: {
    marginBottom: 12,
  },
  biometricButton: {
    marginBottom: 12,
  },
  buttonContent: {
    height: 48,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  forgotButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
