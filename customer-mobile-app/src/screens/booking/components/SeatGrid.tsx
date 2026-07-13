import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Seat } from '../../../data/types';

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onToggleSeat: (seatNumber: string) => void;
}

export function SeatGrid({ seats, selectedSeats, onToggleSeat }: SeatGridProps) {
  const rows: { [key: string]: Seat[] } = {};
  seats.forEach((seat) => {
    const row = seat.number.charAt(0);
    if (!rows[row]) rows[row] = [];
    rows[row].push(seat);
  });

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.box, styles.available]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.box, styles.booked]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.box, styles.selected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {Object.entries(rows).map(([rowName, rowSeats]) => (
          <View key={rowName} style={styles.row}>
            <Text style={styles.rowLabel}>{rowName}</Text>
            {rowSeats.map((seat) => {
              const isSelected = selectedSeats.includes(seat.number);
              const isBooked = seat.isBooked;
              return (
                <TouchableOpacity
                  key={seat.number}
                  disabled={isBooked}
                  onPress={() => onToggleSeat(seat.number)}
                  style={[
                    styles.seat,
                    isBooked && styles.booked,
                    isSelected && styles.selected,
                  ]}
                >
                  <Text style={[styles.seatText, isBooked && styles.bookedText, isSelected && styles.selectedText]}>
                    {seat.number.replace(rowName, '')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  box: { width: 16, height: 16, borderRadius: 4 },
  available: { backgroundColor: '#e2e8f0' },
  booked: { backgroundColor: '#f97316' },
  selected: { backgroundColor: '#3b82f6' },
  legendText: { fontSize: 12, color: '#64748b' },
  grid: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { width: 20, fontSize: 12, fontWeight: '600', color: '#0f172a', textAlign: 'center' },
  seat: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  seatText: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  bookedText: { color: '#fff' },
  selectedText: { color: '#fff' },
});
