import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../constants/theme';

interface SeatMapProps {
  seatsTotal: number;
  seatsBooked: number;
  selectedSeats: string[];
  onSeatToggle: (seatNumber: string) => void;
  price: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seatsTotal,
  seatsBooked,
  selectedSeats,
  onSeatToggle,
  price,
}) => {
  const seatsPerRow = 4;
  const bookedSeats = new Set<string>();

  const totalSeats = Math.min(seatsTotal, 60);
  const rows = Math.ceil(totalSeats / seatsPerRow);

  const generateSeats = () => {
    const seats: { number: string; isBooked: boolean }[] = [];
    for (let i = 1; i <= totalSeats; i++) {
      seats.push({
        number: String(i),
        isBooked: bookedSeats.has(String(i)),
      });
    }
    return seats;
  };

  const seats = generateSeats();

  const getSeatColor = (seat: { number: string; isBooked: boolean }) => {
    if (seat.isBooked) return colors.textLight;
    if (selectedSeats.includes(seat.number)) return colors.accent;
    return colors.surface;
  };

  const getSeatBorderColor = (seat: { number: string; isBooked: boolean }) => {
    if (seat.isBooked) return colors.textLight;
    if (selectedSeats.includes(seat.number)) return colors.accent;
    return colors.border;
  };

  const renderGrid = () => {
    const grid: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      const rowSeats = seats.slice(r * seatsPerRow, (r + 1) * seatsPerRow);
      const row = (
        <View key={r} style={styles.seatRow}>
          {rowSeats.map((seat) => (
            <TouchableOpacity
              key={seat.number}
              style={[
                styles.seat,
                {
                  backgroundColor: getSeatColor(seat),
                  borderColor: getSeatBorderColor(seat),
                },
                seat.isBooked && styles.seatBooked,
                selectedSeats.includes(seat.number) && styles.seatSelected,
              ]}
              onPress={() => !seat.isBooked && onSeatToggle(seat.number)}
              disabled={seat.isBooked}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.seatText,
                  seat.isBooked && styles.seatTextBooked,
                  selectedSeats.includes(seat.number) && styles.seatTextSelected,
                ]}
              >
                {seat.number}
              </Text>
            </TouchableOpacity>
          ))}
          {rowSeats.length < seatsPerRow && (
            <View style={{ flex: seatsPerRow - rowSeats.length }} />
          )}
        </View>
      );
      grid.push(row);
    }
    return grid;
  };

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendAvailable]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBooked]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>

      <View style={styles.busBody}>
        <View style={styles.steeringWheel}>
          <Text style={styles.steeringText}>Driver</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderGrid()}
        </ScrollView>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>
          {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
        </Text>
        <Text style={styles.summaryPrice}>
          {(selectedSeats.length * price).toLocaleString()} XOF
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendAvailable: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  legendSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  legendBooked: {
    backgroundColor: colors.textLight,
    borderColor: colors.textLight,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  busBody: {
    backgroundColor: '#f0f0f5',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  steeringWheel: {
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  steeringText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  seat: {
    width: 48,
    height: 44,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatBooked: {
    opacity: 0.4,
  },
  seatSelected: {
    borderWidth: 2,
  },
  seatText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.text,
  },
  seatTextBooked: {
    color: colors.white,
  },
  seatTextSelected: {
    color: colors.white,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryPrice: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
});
