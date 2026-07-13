import React, { memo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBooking } from '../../hooks/useBooking';
import { useTrips } from '../../hooks/useTrips';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { SeatGrid } from './components/SeatGrid';
import { BookingSummary } from './components/BookingSummary';
import { COLORS, SPACING } from '../../utils/constants';

function BookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const {
    currentTrip,
    selectedSeats,
    seats,
    isLoading,
    totalPrice,
    seatCount,
    loadSeats,
    toggleSeat,
    createBooking,
    reset,
  } = useBooking();
  const { fetchTripById } = useTrips();

  const tripId = route.params?.tripId;

  useEffect(() => {
    loadSeats(tripId);
    if (!currentTrip) fetchTripById(tripId);
    return () => { reset(); };
  }, [tripId]);

  const handleContinue = useCallback(async () => {
    const booking = await createBooking();
    if (booking) {
      navigation.navigate('Payment', { bookingId: booking.id });
    }
  }, [createBooking, navigation]);

  if (isLoading && seats.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!currentTrip) return null;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Seats</Text>
          <Text style={styles.subtitle}>
            {currentTrip.origin} → {currentTrip.destination}
          </Text>
        </View>

        <SeatGrid seats={seats} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />

        <BookingSummary
          trip={currentTrip}
          selectedSeats={selectedSeats}
          totalPrice={totalPrice}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md  }]}>
          <Button
            title={seatCount > 0 ? `Continue (${seatCount} seat${seatCount > 1 ? 's' : ''})` : 'Select at least 1 seat'}
            onPress={handleContinue}
            disabled={seatCount === 0}
            style={styles.continueButton}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    backgroundColor: COLORS.white,
  },
  continueButton: {
    marginTop: SPACING.xs,
  },
});

export default memo(BookingScreen);
