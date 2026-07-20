import apiClient from './client';
import { Booking } from '../types';

export const createBooking = async (data: {
  tripId: string;
  seats: string[];
}) => {
  const res = await apiClient.post('/bookings', data);
  return res.data.data as Booking;
};

export const getMyBookings = async () => {
  const res = await apiClient.get('/bookings/my');
  return res.data.data as Booking[];
};

export const getBookingById = async (id: string) => {
  const res = await apiClient.get(`/bookings/${id}`);
  return res.data.data as Booking;
};

export const cancelBooking = async (id: string) => {
  const res = await apiClient.patch(`/bookings/${id}/cancel`);
  return res.data.data as Booking;
};
