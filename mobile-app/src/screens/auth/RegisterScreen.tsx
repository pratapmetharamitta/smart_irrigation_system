import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
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
import { registerUser } from '../../store/slices/authSlice';
import { theme } from '../../constants/theme';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmId: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    } else {
      newErrors.name = '';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    } else {
      newErrors.email = '';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      isValid = false;
    } else {
      newErrors.password = '';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }
    
    // Terms validation
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
      isValid = false;
    } else {
      newErrors.terms = '';
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      await dispatch(registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        farmId: formData.farmId || undefined,
      })).unwrap();
      
      Alert.alert(
        'Registration Successful',
        'Your account has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <IconButton 
              icon="water" 
              size={60} 
              iconColor={theme.colors.primary}
            />
            <Title style={styles.title}>Create Account</Title>
            <Paragraph style={styles.subtitle}>
              Join Smart Irrigation to manage your farm efficiently.
            </Paragraph>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Full Name"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                style={styles.input}
                error={!!errors.name}
                left={<TextInput.Icon icon="account" />}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                error={!!errors.email}
                left={<TextInput.Icon icon="email" />}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              <TextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
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
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
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

              <TextInput
                label="Farm ID (Optional)"
                value={formData.farmId}
                onChangeText={(value) => updateFormData('farmId', value)}
                mode="outlined"
                autoCapitalize="none"
                style={styles.input}
                left={<TextInput.Icon icon="farm" />}
              />
              <HelperText type="info">
                Enter your farm ID if you have one, or leave blank to create a new farm
              </HelperText>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={acceptTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptTerms(!acceptTerms)}
                />
                <Text style={styles.checkboxText}>
                  I accept the{' '}
                  <Text style={styles.linkText}>Terms & Conditions</Text>
                  {' '}and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>
              <HelperText type="error" visible={!!errors.terms}>
                {errors.terms}
              </HelperText>

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
              >
                Create Account
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text 
                style={styles.linkText}
                onPress={() => navigation.navigate('Login' as never)}
              >
                Sign In
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
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
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 16,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  registerButton: {
    marginTop: 16,
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

export default RegisterScreen;
