import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useAuthStore } from '../../store/authStore';
import { mockBookings, mockTrips } from '../../data/mock';
import { Booking } from '../../data/types';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '../../utils/format';

function BookingsScreen() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);

  const bookings = useMemo(() => {
    if (!user) return [];
    return mockBookings
      .filter((b) => b.userId === user.id)
      .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }, [user]);

  const getTripRoute = useCallback((tripId: string) => {
    const trip = mockTrips.find((t) => t.id === tripId);
    return trip ? `${trip.origin} → ${trip.destination}` : 'Unknown route';
  }, []);

  const renderItem = useCallback(({ item }: { item: Booking }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.route}>{getTripRoute(item.tripId)}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Seats</Text>
          <Text style={styles.value}>{item.seats.join(', ')}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Total</Text>
          <Text style={[styles.value, styles.price]}>{formatCurrency(item.totalPrice ?? 0)}</Text>
        </View>
        <Text style={styles.date}>{formatDate(item.bookingDate)}</Text>
      </View>
    );
  }, [getTripRoute]);

  const keyExtractor = useCallback((item: Booking) => item.id, []);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Bookings</Text>
        <View style={styles.spacer} />
      </View>
      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No bookings yet</Text>
        }
      />
    </ScreenWrapper>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backText: { fontSize: FONT_SIZE.body, color: COLORS.primary, fontWeight: '600' },
  title: { flex: 1, fontSize: FONT_SIZE.headline, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  spacer: { width: 60 },
  list: { padding: SPACING.md },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  route: { fontSize: FONT_SIZE.body, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm },
  badgeText: { fontSize: FONT_SIZE.caption, fontWeight: '600' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs + 2 },
  label: { fontSize: FONT_SIZE.body, color: COLORS.textSecondary },
  value: { fontSize: FONT_SIZE.body, fontWeight: '600', color: COLORS.text },
  price: { color: COLORS.primary },
  date: { fontSize: FONT_SIZE.caption, color: COLORS.textTertiary, marginTop: SPACING.xs },
  empty: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONT_SIZE.body, paddingTop: SPACING.xl },
});
}

export default memo(BookingsScreen);
