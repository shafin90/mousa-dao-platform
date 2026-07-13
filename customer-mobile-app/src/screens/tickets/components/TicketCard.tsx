import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ticket, Trip } from '../../../data/types';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../../../utils/constants';
import { useColors } from '../../../hooks/useColors';
import { formatDate, getStatusColor, getStatusLabel, formatCurrency } from '../../../utils/format';

interface TicketCardProps {
  ticket: Ticket;
  trip?: Trip;
  onPress: (ticketId: string) => void;
}

function TicketCardComponent({ ticket, trip, onPress }: TicketCardProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const handlePress = useCallback(() => onPress(ticket.id), [ticket.id, onPress]);

  const statusColor = useMemo(() => getStatusColor(ticket.status), [ticket.status]);
  const statusLabel = useMemo(() => getStatusLabel(ticket.status), [ticket.status]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={styles.routeContainer}>
          {trip && (
            <>
              <Text style={styles.route}>{trip.origin} → {trip.destination}</Text>
              <Text style={styles.date}>{formatDate(trip.date)}</Text>
            </>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.middleRow}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Seat</Text>
          <Text style={styles.detailValue}>{ticket.seatNumber}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Passenger</Text>
          <Text style={styles.detailValue}>{ticket.passengerName}</Text>
        </View>
      </View>

      <View style={styles.ticketIdRow}>
        <Text style={styles.ticketIdLabel}>Ticket #</Text>
        <Text style={styles.ticketId}>{ticket.id.slice(-8).toUpperCase()}</Text>
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
    marginBottom: SPACING.sm + 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  routeContainer: {
    flex: 1,
  },
  route: {
    fontSize: FONT_SIZE.headline,
    fontWeight: '700',
    color: COLORS.text,
  },
  date: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '600',
  },
  middleRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  detail: {},
  detailLabel: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  ticketIdLabel: {
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  ticketId: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
});
}

export const TicketCard = memo(TicketCardComponent);
