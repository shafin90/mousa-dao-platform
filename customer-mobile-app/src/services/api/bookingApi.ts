import apiClient from './client';
import { Booking } from '../../data/types';

export const bookingApi = {
  create: async (payload: { tripId: string; seats: string[] }): Promise<{ booking: Booking; eventId: string }> => {
    const { data } = await apiClient.post('/bookings', payload);
    return data.data;
  },
  getMy: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get('/bookings/my');
    return (data.data || []).map((b: any) => ({
      id: b._id || b.id,
      tripId: b.tripId,
      seats: b.seats || [],
      totalAmount: b.totalAmount,
      totalPrice: b.totalPrice,
      status: b.status,
      bookingDate: b.createdAt || b.bookingDate,
      paymentStatus: b.paymentStatus,
    }));
  },
  cancel: async (id: string): Promise<Booking> => {
    const { data } = await apiClient.patch(`/bookings/${id}/cancel`);
    return data.data;
  },
};
