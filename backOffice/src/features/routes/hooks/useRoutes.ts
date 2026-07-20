import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchRoutes, createRoute as createRouteAction, updateRoute as updateRouteAction, deleteRoute as deleteRouteAction } from "../store/routeSlice";
import type { RouteInput } from "@/api/routeApi";

export const useRoutes = () => {
  const dispatch = useAppDispatch();
  const { routes = [], loading, error } = useAppSelector((state) => state.routes) || {};
  useEffect(() => { if (routes.length === 0) dispatch(fetchRoutes()); }, [dispatch, routes.length]);
  const create = useCallback((payload: RouteInput) => dispatch(createRouteAction(payload)), [dispatch]);
  const update = useCallback((id: string, payload: Partial<RouteInput>) => dispatch(updateRouteAction({ id, payload })), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchRoutes()), [dispatch]);
  const remove = useCallback((id: string) => dispatch(deleteRouteAction(id)), [dispatch]);
  return { routes, loading, error, create, update, remove, refresh };
};
