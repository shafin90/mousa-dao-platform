import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trip } from '../../../data/types';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { formatCurrency, formatTime, formatDate } from '../../../utils/format';

interface BookingSummaryProps {
  trip: Trip;
  selectedSeats: string[];
  totalPrice: number;
}

function BookingSummaryComponent({ trip, selectedSeats, totalPrice }: BookingSummaryProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Route</Text>
        <Text style={styles.value}>{trip.origin} → {trip.destination}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{formatDate(trip.date)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Time</Text>
        <Text style={styles.value}>{formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Bus</Text>
        <Text style={styles.value}>{trip.busName}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Seats</Text>
        <Text style={styles.value}>{selectedSeats.join(', ') || 'None selected'}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.label}>Seats ({selectedSeats.length})</Text>
        <Text style={styles.value}>{formatCurrency(trip.price)} each</Text>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
      </View>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    marginHorizontal: SPACING.md,
    },
    title: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SPACING.xs + 2,
    },
    label: {
      fontSize: FONT_SIZE.body,
      color: COLORS.textSecondary,
    },
    value: {
      fontSize: FONT_SIZE.body,
      color: COLORS.text,
      fontWeight: '600',
      textAlign: 'right',
      flex: 1,
      marginLeft: SPACING.md,
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.cardBorder,
      marginVertical: SPACING.sm,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: SPACING.sm,
    },
    totalLabel: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.text,
    },
    totalValue: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: COLORS.primary,
    },
  });
}

export const BookingSummary = memo(BookingSummaryComponent);
