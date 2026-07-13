import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Trip } from '../../../data/types';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';
import { formatCurrency, formatTime, getTripDuration } from '../../../utils/format';

interface PopularTripCardProps {
  trip: Trip;
  onPress: (tripId: string) => void;
}

function PopularTripCardComponent({ trip, onPress }: PopularTripCardProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const handlePress = useCallback(() => onPress(trip.id), [trip.id, onPress]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.route}>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(trip.departureTime)}</Text>
          <Text style={styles.city}>{trip.origin}</Text>
        </View>
        <View style={styles.durationBlock}>
          <View style={styles.line} />
          <Text style={styles.duration}>{getTripDuration(trip.departureTime, trip.arrivalTime)}</Text>
        </View>
        <View style={styles.timeBlock}>
          <Text style={styles.time}>{formatTime(trip.arrivalTime)}</Text>
          <Text style={styles.city}>{trip.destination}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.busName}>{trip.busName}</Text>
        <Text style={styles.price}>{formatCurrency(trip.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: COLORS.white,
      borderWidth: 1,
      borderColor: COLORS.cardBorder,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginRight: SPACING.md,
      width: 260,
    },
    route: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    timeBlock: {
      alignItems: 'center',
    },
    time: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.text,
    },
    city: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
      marginTop: 2,
    },
    durationBlock: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
    },
    line: {
      width: '100%',
      height: 1,
      backgroundColor: COLORS.cardBorder,
      marginBottom: 2,
    },
    duration: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    busName: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
    },
    price: {
      fontSize: FONT_SIZE.headline,
      fontWeight: '700',
      color: COLORS.primary,
    },
  });
}

export const PopularTripCard = memo(PopularTripCardComponent);
