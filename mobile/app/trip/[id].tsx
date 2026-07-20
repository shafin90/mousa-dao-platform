import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { SeatMap } from '../../src/components/SeatMap';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { getTripById } from '../../src/api/trips';
import { Trip } from '../../src/types';
import { formatCurrency, formatDate, formatTime } from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      const data = await getTripById(id);
      setTrip(data);
    } catch {
      Alert.alert('Error', 'Unable to load trip details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading || !trip) return <LoadingScreen message="Loading trip..." />;

  const handleSeatToggle = (seatNumber: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const totalAmount = selectedSeats.length * trip.price;
  const available = trip.seatsTotal - trip.seatsBooked;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tripHeader}>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <Text style={styles.routeTime}>{formatTime(trip.departureTime)}</Text>
              <Text style={styles.routeStation}>{trip.fromStation?.name}</Text>
            </View>
            <View style={styles.routeConnector}>
              <View style={styles.connectorDot} />
              <View style={styles.connectorLine} />
              <View style={[styles.connectorDot, styles.connectorDotEnd]} />
            </View>
            <View style={styles.routePoint}>
              <Text style={styles.routeTime}>{formatTime(trip.arrivalTime)}</Text>
              <Text style={styles.routeStation}>{trip.toStation?.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{formatDate(trip.date)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="bus-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.infoText}>{trip.busId?.name || 'Bus'}</Text>
            </View>
          </View>

          <View style={styles.priceBadge}>
            <Text style={styles.priceLabel}>Price per seat</Text>
            <Text style={styles.priceValue}>{formatCurrency(trip.price)}</Text>
          </View>
        </View>

        <View style={styles.seatSection}>
          <View style={styles.seatHeader}>
            <Text style={styles.seatTitle}>Choose your seats</Text>
            <Text
              style={[
                styles.seatAvailability,
                { color: available > 0 ? colors.success : colors.error },
              ]}
            >
              {available} available
            </Text>
          </View>

          <SeatMap
            seatsTotal={trip.seatsTotal}
            seatsBooked={trip.seatsBooked}
            selectedSeats={selectedSeats}
            onSeatToggle={handleSeatToggle}
            price={trip.price}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomPrice}>{formatCurrency(totalAmount)}</Text>
        </View>
        <Button
          title="Book"
          onPress={() =>
            router.push({
              pathname: '/checkout',
              params: { tripId: trip._id, seats: selectedSeats.join(','), totalAmount: String(totalAmount) },
            })
          }
          disabled={selectedSeats.length === 0}
          size="lg"
          style={styles.bottomButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  tripHeader: {
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
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeTime: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  routeStation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  routeConnector: {
    width: 60,
    alignItems: 'center',
  },
  connectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  connectorDotEnd: {
    backgroundColor: colors.accent,
  },
  connectorLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  priceBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent + '10',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  priceValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  seatSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  seatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  seatTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  seatAvailability: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  bottomPrice: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.accent,
  },
  bottomButton: {
    minWidth: 140,
  },
});
