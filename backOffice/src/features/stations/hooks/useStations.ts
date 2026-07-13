import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchStations, createStation as createStationAction, updateStation as updateStationAction, deleteStation as deleteStationAction } from "../store/stationSlice";
import type { StationData } from "@/api/stationApi";

export const useStations = () => {
  const dispatch = useAppDispatch();
  const { stations, loading, error } = useAppSelector((state) => state.stations);
  useEffect(() => { if (stations.length === 0) dispatch(fetchStations()); }, [dispatch, stations.length]);
  const create = useCallback((payload: Partial<StationData>) => dispatch(createStationAction(payload)), [dispatch]);
  const update = useCallback((id: string, payload: Partial<StationData>) => dispatch(updateStationAction({ id, payload })), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchStations()), [dispatch]);
  const remove = useCallback((id: string) => dispatch(deleteStationAction(id)), [dispatch]);
  return { stations, loading, error, create, update, remove, refresh };
};
