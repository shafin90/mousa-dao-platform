import { create } from 'zustand';
import { Trip, Seat, Booking, BookingStatus } from '../data/types';

interface BookingState {
  currentTrip: Trip | null;
  selectedSeats: string[];
  seats: Seat[];
  booking: Booking | null;
  isLoading: boolean;
  setCurrentTrip: (trip: Trip | null) => void;
  setSeats: (seats: Seat[]) => void;
  toggleSeat: (seatNumber: string) => void;
  setBooking: (booking: Booking | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  currentTrip: null,
  selectedSeats: [],
  seats: [],
  booking: null,
  isLoading: false,
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setSeats: (seats) => set({ seats }),
  toggleSeat: (seatNumber) =>
    set((state) => {
      const exists = state.selectedSeats.includes(seatNumber);
      return {
        selectedSeats: exists
          ? state.selectedSeats.filter((s) => s !== seatNumber)
          : [...state.selectedSeats, seatNumber],
        seats: state.seats.map((s) =>
          s.number === seatNumber
            ? { ...s, isSelected: !s.isSelected }
            : s
        ),
      };
    }),
  setBooking: (booking) => set({ booking }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ currentTrip: null, selectedSeats: [], seats: [], booking: null }),
}));
