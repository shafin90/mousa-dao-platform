import { create } from 'zustand';
import { Trip, TripSearchParams } from '../data/types';

interface TripState {
  trips: Trip[];
  popularTrips: Trip[];
  selectedTrip: Trip | null;
  searchParams: TripSearchParams;
  isLoading: boolean;
  setTrips: (trips: Trip[]) => void;
  setPopularTrips: (trips: Trip[]) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setSearchParams: (params: TripSearchParams) => void;
  setLoading: (loading: boolean) => void;
  clearSearch: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  popularTrips: [],
  selectedTrip: null,
  searchParams: {},
  isLoading: false,
  setTrips: (trips) => set({ trips }),
  setPopularTrips: (trips) => set({ popularTrips: trips }),
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),
  setSearchParams: (params) => set({ searchParams: params }),
  setLoading: (isLoading) => set({ isLoading }),
  clearSearch: () => set({ searchParams: {} }),
}));
