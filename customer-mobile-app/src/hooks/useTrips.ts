import { useEffect, useCallback } from 'react';
import { useTripStore } from '../store/tripStore';
import { tripService } from '../services/tripService';
import { TripSearchParams } from '../data/types';

export function useTrips() {
  const { trips, popularTrips, selectedTrip, searchParams, isLoading, setSearchParams, setLoading } = useTripStore();

  const fetchTrips = useCallback(async (params?: TripSearchParams) => {
    setLoading(true);
    try {
      await tripService.getTrips(params);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTripById = useCallback(async (id: string) => {
    return await tripService.getTripById(id);
  }, []);

  const fetchPopularTrips = useCallback(async () => {
    await tripService.getPopularTrips();
  }, []);

  const search = useCallback((params: TripSearchParams) => {
    setSearchParams(params);
    fetchTrips(params);
  }, [fetchTrips]);

  const clearSearch = useCallback(() => {
    setSearchParams({});
  }, []);

  useEffect(() => {
    if (trips.length === 0) fetchTrips();
    fetchPopularTrips();
  }, []);

  return {
    trips: [...trips].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()),
    popularTrips,
    selectedTrip,
    searchParams,
    isLoading,
    fetchTrips,
    fetchTripById,
    fetchPopularTrips,
    search,
    clearSearch,
  };
}
