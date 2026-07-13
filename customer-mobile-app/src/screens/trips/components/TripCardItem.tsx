import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Trip } from '../../../data/types';
import { useColors } from '../../../hooks/useColors';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { formatCurrency, formatTime, getTripDuration } from '../../../utils/format';

interface TripCardItemProps {
  trip: Trip;
  onPress: (tripId: string) => void;
}

function TripCardItemComponent({ trip, onPress }: TripCardItemProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handlePress = useCallback(() => onPress(trip.id), [trip.id, onPress]);

  const availabilityColor = useMemo(
    () => trip.availableSeats < 5 ? COLORS.error : COLORS.textSecondary,
    [trip.availableSeats, COLORS]
  );

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={styles.routeBlock}>
          <Text style={styles.time}>{formatTime(trip.departureTime)}</Text>
          <Text style={styles.city}>{trip.origin}</Text>
        </View>
        <View style={styles.middleBlock}>
          <View style={styles.line} />
          <Text style={styles.duration}>{getTripDuration(trip.departureTime, trip.arrivalTime)}</Text>
          <View style={styles.line} />
        </View>
        <View style={styles.routeBlock}>
          <Text style={styles.time}>{formatTime(trip.arrivalTime)}</Text>
          <Text style={styles.city}>{trip.destination}</Text>
        </View>
      </View>
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.busName}>{trip.busName}</Text>
          <Text style={[styles.availability, { color: availabilityColor }]}>
            {trip.availableSeats} seats left
          </Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatCurrency(trip.price)}</Text>
          <Text style={styles.perSeat}>per seat</Text>
        </View>
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
      marginHorizontal: SPACING.md,  
      marginTop: SPACING.sm,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm + 4,
    },
    routeBlock: {
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
    middleBlock: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
    },
    line: {
      width: '100%',
      height: 1,
      backgroundColor: COLORS.cardBorder,
    },
    duration: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
      marginVertical: 2,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
    },
    busName: {
      fontSize: FONT_SIZE.body,
      fontWeight: '600',
      color: COLORS.text,
    },
    availability: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
      marginTop: 2,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    price: {
      fontSize: FONT_SIZE.title,
      fontWeight: '700',
      color: COLORS.primary,
    },
    perSeat: {
      fontSize: FONT_SIZE.caption,
      color: COLORS.textSecondary,
    },
  });
}

export const TripCardItem = memo(TripCardItemComponent);
