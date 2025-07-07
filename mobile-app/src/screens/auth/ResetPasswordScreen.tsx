import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { 
  TextInput, 
  Button, 
  Text, 
  Card, 
  Title, 
  Paragraph,
  IconButton,
  HelperText
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { theme } from '../../constants/theme';

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const token = (route.params as any)?.token || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      Alert.alert(
        'Invalid Link',
        'The reset link is invalid or has expired. Please request a new one.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ForgotPassword' as never),
          },
        ]
      );
    }
  }, [token, navigation]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      isValid = false;
    } else {
      newErrors.password = '';
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    try {
      // This will be implemented with actual API call
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Password reset failed');
      }

      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset password. Please try again.');
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
            icon="arrow-left" 
            size={24} 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <IconButton 
            icon="lock-reset" 
            size={60} 
            iconColor={theme.colors.primary}
          />
          <Title style={styles.title}>Reset Password</Title>
          <Paragraph style={styles.subtitle}>
            Enter your new password below. Make sure it's strong and secure.
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="New Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              error={!!errors.password}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              error={!!errors.confirmPassword}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementsText}>• At least 8 characters long</Text>
              <Text style={styles.requirementsText}>• Contains uppercase and lowercase letters</Text>
              <Text style={styles.requirementsText}>• Contains at least one number</Text>
            </View>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.resetButton}
              contentStyle={styles.buttonContent}
            >
              Reset Password
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remember your password?{' '}
            <Text 
              style={styles.linkText}
              onPress={() => navigation.navigate('Login' as never)}
            >
              Sign In
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: -10,
    top: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  input: {
    marginBottom: 8,
  },
  passwordRequirements: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  requirementsText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  resetButton: {
    marginTop: 8,
  },
  buttonContent: {
    height: 48,
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

export default ResetPasswordScreen;
