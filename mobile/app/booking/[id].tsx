import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, borderRadius, fontSize, spacing } from '../../src/constants/theme';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { getBookingById, cancelBooking } from '../../src/api/bookings';
import { Booking } from '../../src/types';
import {
  formatCurrency,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusLabel,
} from '../../src/utils/format';
import { Ionicons } from '@expo/vector-icons';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const data = await getBookingById(id);
      setBooking(data);
    } catch {
      Alert.alert('Error', 'Unable to load booking');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelBooking(id);
              Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
              loadBooking();
            } catch (err: any) {
              Alert.alert(
                'Error',
                err?.response?.data?.message || 'Unable to cancel booking'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !booking) return <LoadingScreen message="Loading..." />;

  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const statusColor = getStatusColor(booking.status);
  const paymentColor = getStatusColor(booking.paymentStatus);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <View style={[styles.statusBadgeLarge, { backgroundColor: statusColor + '15' }]}>
          <Ionicons
            name={
              booking.status === 'confirmed'
                ? 'checkmark-circle'
                : booking.status === 'cancelled'
                ? 'close-circle'
                : 'time'
            }
            size={32}
            color={statusColor}
          />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {getStatusLabel(booking.status)}
          </Text>
        </View>
        <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip</Text>
        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <Text style={styles.routeTime}>
              {booking.tripId?.departureTime
                ? formatTime(booking.tripId.departureTime)
                : '--:--'}
            </Text>
            <Text style={styles.routeStation}>
              {booking.tripId?.fromStation?.name || 'Departure'}
            </Text>
          </View>
          <View style={styles.routeArrow}>
            <Ionicons name="arrow-forward" size={20} color={colors.textLight} />
          </View>
          <View style={styles.routePoint}>
            <Text style={styles.routeTime}>
              {booking.tripId?.arrivalTime
                ? formatTime(booking.tripId.arrivalTime)
                : '--:--'}
            </Text>
            <Text style={styles.routeStation}>
              {booking.tripId?.toStation?.name || 'Arrival'}
            </Text>
          </View>
        </View>
        {booking.tripId?.date && (
          <Text style={styles.dateText}>{formatDate(booking.tripId.date)}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Seats</Text>
          <Text style={styles.detailValue}>
            {booking.seats.join(', ')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValueAccent}>
            {formatCurrency(booking.totalAmount)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment</Text>
          <View
            style={[
              styles.miniBadge,
              { backgroundColor: paymentColor + '20' },
            ]}
          >
            <Text style={[styles.miniBadgeText, { color: paymentColor }]}>
              {getStatusLabel(booking.paymentStatus)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Booking Date</Text>
          <Text style={styles.detailValue}>
            {new Date(booking.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {canCancel && (
        <Button
          title="Cancel Booking"
          onPress={handleCancel}
          variant="danger"
          loading={cancelling}
          size="lg"
          style={styles.cancelButton}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadgeLarge: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  bookingCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: {
    flex: 1,
    alignItems: 'center',
  },
  routeTime: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  routeStation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  routeArrow: {
    paddingHorizontal: spacing.md,
  },
  dateText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  miniBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  miniBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
