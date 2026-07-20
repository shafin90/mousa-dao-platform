import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../constants/theme';
import { Booking } from '../types';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/format';

interface BookingCardProps {
  booking: Booking;
  onPress: (booking: Booking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onPress }) => {
  const statusColor = getStatusColor(booking.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(booking)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.routeInfo}>
        <Text style={styles.stationText} numberOfLines={1}>
          {booking.tripId?.fromStation?.name || 'Departure'} →{' '}
          {booking.tripId?.toStation?.name || 'Arrival'}
        </Text>
        <Text style={styles.dateText}>
          {booking.tripId?.date ? formatDate(booking.tripId.date) : ''}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Seats</Text>
          <Text style={styles.detailValue}>{booking.seats.join(', ')}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValueAccent}>
            {formatCurrency(booking.totalAmount)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Payment</Text>
          <Text
            style={[
              styles.detailValue,
              { color: getStatusColor(booking.paymentStatus) },
            ]}
          >
            {getStatusLabel(booking.paymentStatus)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bookingCode: {
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
  routeInfo: {
    marginBottom: spacing.sm,
  },
  stationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  dateText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 2,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  detailValueAccent: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.accent,
  },
});
