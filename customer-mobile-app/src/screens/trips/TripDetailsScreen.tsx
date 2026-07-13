import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrips } from '../../hooks/useTrips';
import { useBooking } from '../../hooks/useBooking';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { TripDetailHeader } from './components/TripDetailHeader';
import { TripInfo } from './components/TripInfo';
import { useColors } from '../../hooks/useColors';
import { SPACING } from '../../utils/constants';

function TripDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { selectedTrip, fetchTripById, isLoading } = useTrips();
  const { setCurrentTrip } = useBooking();
  const tripId = route.params?.tripId;
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useEffect(() => {
    if (tripId) fetchTripById(tripId);
  }, [tripId]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleBook = useCallback(() => {
    if (selectedTrip) {
      setCurrentTrip(selectedTrip);
      navigation.navigate('Booking', { tripId: selectedTrip.id });
    }
  }, [selectedTrip, setCurrentTrip, navigation]);

  const showBooking = useMemo(() => {
    return selectedTrip && selectedTrip.status === 'scheduled' && selectedTrip.availableSeats > 0;
  }, [selectedTrip]);

  if (isLoading || !selectedTrip) {
    return (
      <ScreenWrapper>
        <TripDetailHeader origin="" destination="" onBack={handleBack} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TripDetailHeader
          origin={selectedTrip.origin}
          destination={selectedTrip.destination}
          onBack={handleBack}
        />
        <TripInfo trip={selectedTrip} />
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Price per seat</Text>
            <Text style={styles.priceValue}>
              CFA {selectedTrip.price.toLocaleString()}
            </Text>
          </View>
          <Button
            title={showBooking ? 'Select Seats' : 'Not Available'}
            onPress={handleBook}
            disabled={!showBooking}
            style={styles.bookButton}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      padding: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.cardBorder,
      backgroundColor: COLORS.white,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    priceLabel: {
      fontSize: 15,
      color: COLORS.textSecondary,
    },
    priceValue: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.primary,
    },
    bookButton: {
      marginTop: SPACING.xs,
    },
  });
}

export default memo(TripDetailsScreen);
