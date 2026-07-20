import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../src/constants/theme';
import { Button } from '../src/components/Button';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { getTripById } from '../src/api/trips';
import { createBooking } from '../src/api/bookings';
import { createPaymentIntent } from '../src/api/payments';
import { Trip } from '../src/types';
import { formatCurrency } from '../src/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { initializeStripe, useStripe } from '../src/services/stripe';

export default function CheckoutScreen() {
  const { tripId, seats, totalAmount } = useLocalSearchParams<{
    tripId: string;
    seats: string;
    totalAmount: string;
  }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const seatsArray = seats ? seats.split(',') : [];
  const amount = Number(totalAmount) || 0;

  useEffect(() => {
    loadTrip();
    initializeStripe();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const data = await getTripById(tripId);
      setTrip(data);
    } catch {
      Alert.alert('Error', 'Unable to load information');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const booking = await createBooking({
        tripId,
        seats: seatsArray,
      });

      const { clientSecret } = await createPaymentIntent({
        bookingId: booking._id,
      });

      const { error: sheetError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Mousa Transport',
        style: 'alwaysLight',
        defaultBillingDetails: {
          name: 'Customer',
        },
      });

      if (sheetError) {
        Alert.alert('Error', sheetError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          Alert.alert('Payment Cancelled', 'You can try again whenever you want.');
        } else {
          Alert.alert('Payment Error', presentError.message);
        }
        return;
      }

      Alert.alert(
        'Payment Successful',
        'Your booking has been confirmed. You will receive your ticket by notification.',
        [
          {
            text: 'View My Bookings',
            onPress: () => router.push('/(tabs)/bookings'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'An error occurred during payment'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !trip) return <LoadingScreen message="Preparing payment..." />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={styles.summaryRow}>
            <Ionicons name="bus-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Trip</Text>
              <Text style={styles.summaryValue}>
                {trip.fromStation?.name} → {trip.toStation?.name}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {new Date(trip.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {trip.departureTime}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Seats</Text>
              <Text style={styles.summaryValue}>{seatsArray.join(', ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {seatsArray.length} seat{seatsArray.length > 1 ? 's' : ''} ×{' '}
              {formatCurrency(trip.price)}
            </Text>
            <Text style={styles.priceValue}>{formatCurrency(amount)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total to pay</Text>
            <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethod}>
            <Ionicons name="card-outline" size={24} color={colors.primary} />
            <Text style={styles.paymentMethodText}>Credit Card (Stripe)</Text>
          </View>
          <Text style={styles.paymentNote}>
            Secure payment via Stripe. Your banking information is encrypted.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={`Pay ${formatCurrency(amount)}`}
          onPress={handlePay}
          loading={processing}
          disabled={processing}
          size="lg"
          style={styles.payButton}
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
  section: {
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
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  summaryContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.accent,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  paymentMethodText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.md,
  },
  paymentNote: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payButton: {
    width: '100%',
  },
});
