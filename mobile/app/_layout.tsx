import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { storage } from '../src/utils/storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState<'auth' | 'main' | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await storage.getToken();
    setInitialRoute(token ? 'main' : 'auth');
  };

  if (!initialRoute) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1a1a2e" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51NI6RJJlO98Mt1tpy1EJVt8YGEWmBjaYDBIbiKK3TicjVHJyQVwUEoDnTEJJfOaHDebDD7I0KNZ45HxJrisVNUDD006WpyiR5T'}
        merchantIdentifier="merchant.com.mousa.transport"
      >
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          {initialRoute === 'auth' ? (
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          ) : (
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          )}
          <Stack.Screen
            name="trip/[id]"
            options={{ headerShown: true, headerTitle: 'Trip Details', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="checkout"
            options={{ headerShown: true, headerTitle: 'Payment', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="booking/[id]"
            options={{ headerShown: true, headerTitle: 'Booking', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="tracking/[id]"
            options={{ headerShown: true, headerTitle: 'Live Tracking', headerBackTitle: 'Back' }}
          />
        </Stack>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
