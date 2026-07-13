import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchTickets } from "../store/ticketSlice";

export const useTickets = () => {
  const dispatch = useAppDispatch();
  const { tickets, loading, error } = useAppSelector((state) => state.tickets);
  useEffect(() => { if (tickets.length === 0) dispatch(fetchTickets()); }, [dispatch, tickets.length]);
  const search = useCallback((query: string) => dispatch(fetchTickets({ search: query || undefined })), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchTickets()), [dispatch]);
  return { tickets, loading, error, search, refresh };
};
