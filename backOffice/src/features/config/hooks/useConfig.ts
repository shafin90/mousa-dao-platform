import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchConfig, updateConfig as updateConfigAction, resetConfig as resetConfigAction } from "../store/configSlice";
import type { ConfigData } from "@/api/configApi";

export const useConfig = () => {
  const dispatch = useAppDispatch();
  const { config, loading, error } = useAppSelector((state) => state.config) || {};

  useEffect(() => { if (!config) dispatch(fetchConfig()); }, [dispatch, config]);

  const update = useCallback((payload: Partial<ConfigData>) => dispatch(updateConfigAction(payload)), [dispatch]);
  const reset = useCallback(() => dispatch(resetConfigAction()), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchConfig()), [dispatch]);

  return { config, loading, error, update, reset, refresh };
};
