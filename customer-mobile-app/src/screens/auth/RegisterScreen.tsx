import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SPACING, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

function RegisterScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = useCallback(async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    try {
      await register({ name, email, phone, password });
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    }
  }, [name, email, phone, password, register]);

  const handleLogin = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start booking</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
          />

          <Button
            title="Already have an account? Sign In"
            onPress={handleLogin}
            variant="ghost"
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: SPACING.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: SPACING.xl + SPACING.md,
    },
    title: {
      fontSize: FONT_SIZE.largeTitle,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.sm,
    },
    subtitle: {
      fontSize: FONT_SIZE.body,
      color: COLORS.textSecondary,
    },
    form: {
      width: '100%',
    },
    button: {
      marginTop: SPACING.sm,
    },
    error: {
      color: COLORS.error,
      fontSize: FONT_SIZE.caption,
      textAlign: 'center',
      marginBottom: SPACING.sm,
    },
  });
}

export default memo(RegisterScreen);
