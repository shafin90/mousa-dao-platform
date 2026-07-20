import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { confirmOtp, getIdToken } from '../../src/services/firebase';
import { storage } from '../../src/utils/storage';
import { firebaseAuth } from '../../src/api/auth';

export default function VerifyOtpScreen() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      console.log('confirming OTP...');
      await confirmOtp(otp);
      console.log('OTP confirmed, getting ID token...');

      const idToken = await getIdToken();
      console.log('ID token:', idToken?.slice(0, 20) + '...');
      const phone = await storage.getFirebasePhone();

      if (!idToken || !phone) {
        Alert.alert('Error', 'Unable to retrieve your information');
        return;
      }

      console.log('authenticating with backend...');
      const authResult = await firebaseAuth(idToken, phone);
      console.log('backend auth success');
      await storage.setToken(authResult.token);
      await storage.setUser(authResult.user);
      await storage.removeFirebasePhone();
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Verify error - code:', err.code, 'message:', err.message, 'stack:', err.stack?.slice(0, 300));
      const message =
        err.code === 'auth/invalid-verification-code'
          ? 'Invalid code. Try again.'
          : err.message || 'Verification error. Try again.';
      Alert.alert('Error', message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent via SMS
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
              ]}
              value={digit}
              onChangeText={(v) => handleCodeChange(v, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title="Verify"
          onPress={handleVerify}
          loading={loading}
          disabled={code.join('').length !== 6}
          size="lg"
          style={styles.button}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.surface,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  button: {
    width: '100%',
  },
});
