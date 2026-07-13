import React, { memo, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SPACING, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';

function LoginScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('ahmed@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    setError('');
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  }, [email, password, login]);

  const handleRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>BusTicket</Text>
          <Text style={styles.subtitle}>Book your bus tickets instantly</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
          />

          <Button
            title="Create Account"
            onPress={handleRegister}
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
      marginBottom: SPACING.xl + SPACING.lg,
    },
    title: {
      fontSize: FONT_SIZE.largeTitle + 4,
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

export default memo(LoginScreen);
