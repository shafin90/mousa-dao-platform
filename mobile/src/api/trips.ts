import apiClient from './client';
import { Trip, Station } from '../types';

export const searchTrips = async (params: {
  fromStation?: string;
  toStation?: string;
  date?: string;
  priceMin?: number;
  priceMax?: number;
}) => {
  const res = await apiClient.get('/trips', { params });
  return res.data.data as Trip[];
};

export const getTripById = async (id: string) => {
  const res = await apiClient.get(`/trips/${id}`);
  return res.data.data as Trip;
};

export const getStations = async () => {
  const res = await apiClient.get('/stations');
  return res.data.data as Station[];
};

export const getStationDistance = async (from: string, to: string) => {
  const res = await apiClient.get('/stations/distance', {
    params: { from, to },
  });
  return res.data.data;
};
