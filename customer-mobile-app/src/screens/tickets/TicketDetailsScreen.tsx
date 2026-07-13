import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTickets } from '../../hooks/useTickets';
import { useTrips } from '../../hooks/useTrips';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { QRCodeView } from './components/QRCode';
import { Ticket, Trip } from '../../data/types';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../utils/constants';
import { useColors } from '../../hooks/useColors';
import { formatDate, formatTime, formatCurrency, getStatusColor, getStatusLabel } from '../../utils/format';

function TicketDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { getTicketById, isLoading } = useTickets();
  const { trips } = useTrips();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const ticketId = route.params?.ticketId;

  useEffect(() => {
    if (ticketId) {
      getTicketById(ticketId).then((t) => setTicket(t ?? null));
    }
  }, [ticketId]);

  const trip = useMemo(() => {
    if (!ticket) return null;
    return trips.find(t => t.id === ticket.tripId) || null;
  }, [ticket, trips]);
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const statusColor = useMemo(() => ticket ? getStatusColor(ticket.status) : COLORS.textSecondary, [ticket, COLORS]);
  const statusLabel = useMemo(() => ticket ? getStatusLabel(ticket.status) : '', [ticket]);

  if (isLoading || !ticket) {
    return (
      <ScreenWrapper>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ticket Details</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.content}>
          <QRCodeView value={ticket.qrCode} />

          <View style={styles.infoCard}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            {trip && (
              <>
                <View style={styles.routeSection}>
                  <Text style={styles.routeTitle}>Route</Text>
                  <Text style={styles.routeText}>{trip.origin} → {trip.destination}</Text>
                  <Text style={styles.dateText}>{formatDate(trip.date)}</Text>
                </View>

                <View style={styles.timeSection}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Departure</Text>
                    <Text style={styles.timeValue}>{formatTime(trip.departureTime)}</Text>
                    <Text style={styles.locationText}>{trip.origin}</Text>
                  </View>
                  <View style={styles.timeSeparator}>
                    <Text style={styles.durationText}>{trip.busName}</Text>
                  </View>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>Arrival</Text>
                    <Text style={styles.timeValue}>{formatTime(trip.arrivalTime)}</Text>
                    <Text style={styles.locationText}>{trip.destination}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Passenger</Text>
                <Text style={styles.detailValue}>{ticket.passengerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Seat Number</Text>
                <Text style={[styles.detailValue, styles.seatNumber]}>{ticket.seatNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ticket ID</Text>
                <Text style={styles.detailValue}>{ticket.id.toUpperCase()}</Text>
              </View>
              {trip && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={[styles.detailValue, styles.price]}>{formatCurrency(trip.price)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function createStyles(COLORS: ReturnType<typeof useColors>) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backText: {
    fontSize: FONT_SIZE.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZE.headline,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  spacer: {
    width: 60,
  },
  content: {
    padding: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  statusRow: {
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
  },
  routeSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  routeTitle: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  routeText: {
    fontSize: FONT_SIZE.headline,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateText: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  locationText: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeSeparator: {
    paddingHorizontal: SPACING.sm,
  },
  durationText: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  detailSection: {
    paddingTop: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  detailLabel: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  seatNumber: {
    fontSize: FONT_SIZE.title,
    color: COLORS.primary,
  },
  price: {
    color: COLORS.primary,
  },
});
}

export default memo(TicketDetailsScreen);
