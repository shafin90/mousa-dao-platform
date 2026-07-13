import { bookingApi } from './api/bookingApi';
import { Booking, BookingStatus } from '../data/types';
import { useBookingStore } from '../store/bookingStore';

export const bookingService = {
  async createBooking(data: { userId: string; tripId: string; seats: string[]; totalPrice: number }) {
    const result = await bookingApi.create({ tripId: data.tripId, seats: data.seats });
    useBookingStore.getState().setBooking(result.booking);
    return result.booking;
  },

  async getBookingsByUser(): Promise<Booking[]> {
    return await bookingApi.getMy();
  },

  async getBookingById(id: string): Promise<Booking | undefined> {
    const bookings = await bookingApi.getMy();
    return bookings.find(b => b.id === id);
  },

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | undefined> {
    if (status === 'cancelled') {
      return await bookingApi.cancel(id);
    }
    return undefined;
  },
};
