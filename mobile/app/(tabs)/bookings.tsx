import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, fontSize, spacing } from '../../src/constants/theme';
import { BookingCard } from '../../src/components/BookingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { getMyBookings } from '../../src/api/bookings';
import { Booking } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async () => {
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen message="Loading bookings..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={(b) => router.push(`/booking/${b._id}`)}
          />
        )}
        contentContainerStyle={
          bookings.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="ticket-outline" size={64} color={colors.textLight} />}
            title="No bookings yet"
            description="You don't have any bookings yet. Search for a trip to get started."
            actionLabel="Search a trip"
            onAction={() => router.push('/(tabs)')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
