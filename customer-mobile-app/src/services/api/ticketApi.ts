import apiClient from './client';
import { Ticket } from '../../data/types';

export const ticketApi = {
  getMy: async (): Promise<Ticket[]> => {
    const { data } = await apiClient.get('/tickets/my');
    return (data.data || []).map((t: any) => ({
      id: t._id || t.id,
      bookingId: t.bookingId,
      tripId: t.tripId,
      ticketNumber: t.ticketNumber || t.id,
      qrCode: t.qrCode || '',
      status: t.status,
      seatNumber: t.seatNumber || '',
      passengerName: t.passengerName || '',
    }));
  },
  getById: async (id: string): Promise<Ticket> => {
    const { data } = await apiClient.get(`/tickets/${id}`);
    const t = data.data;
    return {
      id: t._id || t.id,
      bookingId: t.bookingId,
      tripId: t.tripId,
      ticketNumber: t.ticketNumber || t.id,
      qrCode: t.qrCode || '',
      status: t.status,
      seatNumber: t.seatNumber || '',
      passengerName: t.passengerName || '',
    };
  },
};
