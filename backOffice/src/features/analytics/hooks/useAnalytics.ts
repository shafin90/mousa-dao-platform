import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchAllAnalytics } from "../store/analyticsSlice";

export const useAnalytics = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    if (!data) {
      dispatch(fetchAllAnalytics());
    }
  }, [dispatch, data]);

  const refresh = useCallback(() => {
    dispatch(fetchAllAnalytics());
  }, [dispatch]);

  return { data, loading, error, refresh };
};
