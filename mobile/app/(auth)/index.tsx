import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { sendOtp } from '../../src/services/firebase';
import { storage } from '../../src/utils/storage';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<any>(null);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[^0-9+]/g, '');
    setPhone(cleaned);
    setError('');
  };

  const handleSendOtp = async () => {
    const cleanedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    if (cleanedPhone.length < 8) {
      setError('Enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(cleanedPhone);
      await storage.setFirebasePhone(cleanedPhone);
      router.push('/(auth)/verify-otp');
    } catch (err: any) { 
      console.log(err)
      console.error('sendOtp error:', err.code, err.message);
      const message =
        err.code === 'auth/invalid-phone-number'
          ? 'Invalid phone number'
          : err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Try again later.'
          : `Failed: ${err.code || err.message}`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.appName}>Mousa Transport</Text>
          <Text style={styles.tagline}>Book your trips with ease</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code
          </Text>

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={validatePhone}
            placeholder="+225 01 02 03 04 05"
            keyboardType="phone-pad"
            autoFocus
            error={error}
            containerStyle={styles.inputContainer}
          />

          <Button
            title="Send Code"
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < 4}
            size="lg"
            style={styles.button}
          />
        </View>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our terms of use
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  appName: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.primary,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  button: {
    width: '100%',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});
