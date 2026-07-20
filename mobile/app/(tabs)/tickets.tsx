import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { getMyTickets } from '../../src/api/tickets';
import { Ticket } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { getStatusColor, getStatusLabel, formatDate, formatTime } from '../../src/utils/format';
import { TouchableOpacity } from 'react-native';

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [])
  );

  const loadTickets = async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen message="Loading tickets..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => router.push(`/booking/${item.bookingId}`)}
            activeOpacity={0.7}
          >
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            {item.qrCode && (
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: item.qrCode }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}
            <Text style={styles.tapText}>Tap for details</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={
          tickets.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="qr-code-outline" size={64} color={colors.textLight} />}
            title="No tickets yet"
            description="Your tickets will appear here after a confirmed booking."
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
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ticketNumber: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  tapText: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});
