import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchFleet, createBus as createBusAction, updateBus as updateBusAction, updateBusStatus as updateStatusAction, deleteBus as deleteBusAction } from "../store/fleetSlice";
import type { BusData } from "@/api/busApi";

export const useFleet = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.fleet);
  useEffect(() => { if (items.length === 0) dispatch(fetchFleet()); }, [dispatch, items.length]);
  const create = useCallback((payload: Partial<BusData>) => dispatch(createBusAction(payload)), [dispatch]);
  const update = useCallback((id: string, payload: Partial<BusData>) => dispatch(updateBusAction({ id, payload })), [dispatch]);
  const updateStatus = useCallback((id: string, status: string) => dispatch(updateStatusAction({ id, status })), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchFleet()), [dispatch]);
  const remove = useCallback((id: string) => dispatch(deleteBusAction(id)), [dispatch]);
  return { fleet: items, loading, error, create, update, updateStatus, remove, refresh };
};
