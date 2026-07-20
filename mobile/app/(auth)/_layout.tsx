import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="verify-otp"
        options={{ headerShown: true, headerTitle: 'Verification', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: true, headerTitle: 'My Profile', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}
