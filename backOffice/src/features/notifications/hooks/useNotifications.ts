import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { fetchNotifications, markAsRead as markReadAction, markAllAsRead as markAllReadAction } from "../store/notificationSlice";

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.notifications);
  useEffect(() => { if (items.length === 0) dispatch(fetchNotifications()); }, [dispatch, items.length]);
  const markRead = useCallback((id: string) => dispatch(markReadAction(id)), [dispatch]);
  const markAllRead = useCallback(() => dispatch(markAllReadAction()), [dispatch]);
  const refresh = useCallback(() => dispatch(fetchNotifications()), [dispatch]);
  return { notifications: items, loading, error, markRead, markAllRead, refresh };
};
