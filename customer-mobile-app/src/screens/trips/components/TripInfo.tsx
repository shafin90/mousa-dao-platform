import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trip } from '../../../data/types';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { formatCurrency, formatTime, formatDate, getTripDuration } from '../../../utils/format';

interface TripInfoProps {
  trip: Trip;
}

function TripInfoComponent({ trip }: TripInfoProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.container}>
      <View style={styles.mainCard}>
        <View style={styles.routeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.time}>{formatTime(trip.departureTime)}</Text>
            <Text style={styles.city}>{trip.origin}</Text>
          </View>
          <View style={styles.durationBlock}>
            <Text style={styles.duration}>{getTripDuration(trip.departureTime, trip.arrivalTime)}</Text>
            <View style={styles.durationLine} />
          </View>
          <View style={styles.timeBlock}>
            <Text style={styles.time}>{formatTime(trip.arrivalTime)}</Text>
            <Text style={styles.city}>{trip.destination}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(trip.date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Bus</Text>
            <Text style={styles.infoValue}>{trip.busName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Available Seats</Text>
            <Text style={[
              styles.infoValue,
              trip.availableSeats < 5 && { color: COLORS.error }
            ]}>
              {trip.availableSeats} / {trip.totalSeats}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={[styles.infoValue, styles.price]}>
              {formatCurrency(trip.price)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
    },
    mainCard: {
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    timeBlock: {
      alignItems: 'center',
    },
    time: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: COLORS.text,
    },
    city: {
      fontSize: FONT_SIZE.body,
      color: COLORS.textSecondary,
      marginTop: SPACING.xs,
    },
    durationBlock: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
    },
    duration: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
      marginBottom: 4,
    },
    durationLine: {
      width: '100%',
      height: 1,
      backgroundColor: COLORS.cardBorder,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    infoItem: {
      flex: 1,
    },
    infoLabel: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      fontSize: FONT_SIZE.body,
      color: COLORS.text,
      fontWeight: '600',
      marginTop: 2,
    },
    price: {
      color: COLORS.primary,
    },
  });
}

export const TripInfo = memo(TripInfoComponent);
