import { useCallback } from 'react';
import { useBookingStore } from '../store/bookingStore';
import { bookingService } from '../services/bookingService';
import { useAuthStore } from '../store/authStore';

export function useBooking() {
  const { currentTrip, selectedSeats, seats, booking, isLoading, setLoading, reset } = useBookingStore();

  const loadSeats = useCallback(async (tripId: string) => {
    const { tripService } = await import('../services/tripService');
    const s = await tripService.getSeatsForTrip(tripId);
    useBookingStore.getState().setSeats(s);
    return s;
  }, []);

  const toggleSeat = useCallback((seatNumber: string) => {
    useBookingStore.getState().toggleSeat(seatNumber);
  }, []);

  const createBooking = useCallback(async () => {
    const user = useAuthStore.getState().user;
    if (!user || !currentTrip) return;
    setLoading(true);
    try {
      const booking = await bookingService.createBooking({
        userId: user.id,
        tripId: currentTrip.id,
        seats: selectedSeats,
        totalPrice: selectedSeats.length * currentTrip.price,
      });
      useBookingStore.getState().setBooking(booking);
      return booking;
    } finally {
      setLoading(false);
    }
  }, [currentTrip, selectedSeats]);

  const confirmBooking = useCallback(async () => {
  }, []);

  const cancelBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    try {
      return await bookingService.updateBookingStatus(bookingId, 'cancelled');
    } finally {
      setLoading(false);
    }
  }, []);

  const totalPrice = currentTrip ? selectedSeats.length * currentTrip.price : 0;
  const seatCount = selectedSeats.length;

  return {
    currentTrip: useBookingStore((s) => s.currentTrip),
    selectedSeats: useBookingStore((s) => s.selectedSeats),
    seats: useBookingStore((s) => s.seats),
    booking: useBookingStore((s) => s.booking),
    isLoading,
    totalPrice,
    seatCount,
    setCurrentTrip: useBookingStore((s) => s.setCurrentTrip),
    loadSeats,
    toggleSeat,
    createBooking,
    confirmBooking,
    cancelBooking,
    reset,
  };
}
