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
  HelperText
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { theme } from '../../constants/theme';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const handleSendResetEmail = async () => {
    if (!validateForm()) return;
    
    try {
      // This will be implemented with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      setIsEmailSent(true);
      Alert.alert(
        'Email Sent',
        'A password reset link has been sent to your email address. Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    await handleSendResetEmail();
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
          <Title style={styles.title}>Forgot Password?</Title>
          <Paragraph style={styles.subtitle}>
            {isEmailSent 
              ? "We've sent a password reset link to your email address."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {!isEmailSent ? (
              <>
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

                <Button
                  mode="contained"
                  onPress={handleSendResetEmail}
                  loading={isLoading}
                  style={styles.sendButton}
                  contentStyle={styles.buttonContent}
                >
                  Send Reset Link
                </Button>
              </>
            ) : (
              <View style={styles.emailSentContainer}>
                <IconButton 
                  icon="check-circle" 
                  size={48} 
                  iconColor={theme.colors.primary}
                />
                <Text style={styles.emailSentText}>
                  Email sent successfully!
                </Text>
                <Paragraph style={styles.emailSentSubtext}>
                  Check your email inbox and click the reset link. If you don't see the email, check your spam folder.
                </Paragraph>
                
                <Button
                  mode="outlined"
                  onPress={handleResendEmail}
                  loading={isLoading}
                  style={styles.resendButton}
                  contentStyle={styles.buttonContent}
                >
                  Resend Email
                </Button>
              </View>
            )}
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
  sendButton: {
    marginTop: 16,
  },
  buttonContent: {
    height: 48,
  },
  emailSentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emailSentText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  emailSentSubtext: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resendButton: {
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

export default ForgotPasswordScreen;
