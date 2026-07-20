import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../constants/theme';
import { Trip } from '../types';
import { formatTime, formatCurrency, getAvailableSeats, getStatusColor } from '../utils/format';

interface TripCardProps {
  trip: Trip;
  onPress: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
  const available = getAvailableSeats(trip.seatsTotal, trip.seatsBooked);
  const statusColor = getStatusColor(trip.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(trip)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.busName}>{trip.busId?.name || 'Bus'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {trip.status}
          </Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.timeColumn}>
          <Text style={styles.time}>{formatTime(trip.departureTime)}</Text>
          <Text style={styles.station} numberOfLines={1}>
            {trip.fromStation?.name || 'Departure'}
          </Text>
        </View>

        <View style={styles.routeLine}>
          <View style={styles.dot} />
          <View style={styles.line} />
          <View style={[styles.dot, styles.dotEnd]} />
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.time}>{formatTime(trip.arrivalTime)}</Text>
          <Text style={styles.station} numberOfLines={1}>
            {trip.toStation?.name || 'Arrival'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Available Seats</Text>
          <Text
            style={[
              styles.infoValue,
              { color: available > 0 ? colors.success : colors.error },
            ]}
          >
            {available} / {trip.seatsTotal}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Price per seat</Text>
          <Text style={styles.price}>
            {formatCurrency(trip.price)}
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
    marginBottom: spacing.md,
  },
  busName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  time: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  station: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  routeLine: {
    width: 60,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotEnd: {
    backgroundColor: colors.accent,
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
  },
  footer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.accent,
  },
});
