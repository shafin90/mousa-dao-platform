import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchTrips, createTrip as createTripAction, updateTrip as updateTripAction, updateTripStatus as updateStatusAction, deleteTrip as deleteTripAction } from "../store/tripSlice";
import type { TripData, TripInput, TripFilters } from "@/api/tripApi";

export const useTrips = (filters?: TripFilters) => {
  const dispatch = useAppDispatch();
  const { items = [], loading, error } = useAppSelector((state) => state.trips) || {};

  useEffect(() => { dispatch(fetchTrips(filters)); }, [dispatch, JSON.stringify(filters)]);

  const create = useCallback((payload: TripInput) => dispatch(createTripAction(payload)), [dispatch]);
  const update = useCallback((id: string, payload: Partial<TripInput>) => dispatch(updateTripAction({ id, payload })), [dispatch]);
  const updateStatus = useCallback((id: string, status: string) => dispatch(updateStatusAction({ id, status })), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchTrips(filters)), [dispatch, JSON.stringify(filters)]);
  const remove = useCallback((id: string) => dispatch(deleteTripAction(id)), [dispatch]);

  return { trips: items, loading, error, create, update, updateStatus, remove, refresh };
};
