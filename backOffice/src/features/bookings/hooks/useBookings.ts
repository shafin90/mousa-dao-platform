import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchBookings } from "../store/bookingSlice";
import type { BookingFilters } from "@/api/bookingApi";

export const useBookings = (filters?: BookingFilters) => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookings(filters));
  }, [dispatch, JSON.stringify(filters)]);

  const refresh = useCallback(() => {
    dispatch(fetchBookings(filters));
  }, [dispatch, filters]);

  return { bookings: items, loading, error, refresh };
};
