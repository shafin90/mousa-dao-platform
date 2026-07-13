import apiClient from './client';
import { Trip, TripSearchParams } from '../../data/types';

export const tripApi = {
  getAll: async (params?: TripSearchParams): Promise<Trip[]> => {
    const query: Record<string, string> = {};
    if (params?.origin) query.fromStation = params.origin;
    if (params?.destination) query.toStation = params.destination;
    if (params?.date) query.date = params.date;
    const { data } = await apiClient.get('/trips', { params: query });
    return (data.data || []).map((t: any) => ({
      id: t._id || t.id,
      routeId: t.routeId,
      busId: t.busId?._id || t.busId,
      busName: t.busId?.name || t.busName || '',
      origin: t.routeId?.fromStation?.name || t.origin || '',
      destination: t.routeId?.toStation?.name || t.destination || '',
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      date: t.date,
      price: t.price,
      availableSeats: (t.seatsTotal || 0) - (t.seatsBooked || 0),
      totalSeats: t.seatsTotal || t.seatsTotal || 0,
      seatsTotal: t.seatsTotal,
      seatsBooked: t.seatsBooked,
      status: t.status,
    }));
  },
  getById: async (id: string): Promise<Trip> => {
    const { data } = await apiClient.get(`/trips/${id}`);
    const t = data.data;
    return {
      id: t._id || t.id,
      routeId: t.routeId,
      busId: t.busId?._id || t.busId,
      busName: t.busId?.name || t.busName || '',
      origin: t.routeId?.fromStation?.name || t.origin || '',
      destination: t.routeId?.toStation?.name || t.destination || '',
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      date: t.date,
      price: t.price,
      availableSeats: (t.seatsTotal || 0) - (t.seatsBooked || 0),
      totalSeats: t.seatsTotal || t.seatsTotal || 0,
      seatsTotal: t.seatsTotal,
      seatsBooked: t.seatsBooked,
      status: t.status,
    };
  },
};
