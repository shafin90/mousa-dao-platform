import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store";
import { login, fetchMe, logout } from "../store/authSlice";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, loading, initialized, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user && !loading) {
      dispatch(fetchMe());
    }
  }, [token, user, loading, dispatch]);

  useEffect(() => {
    const handleLogout = () => dispatch(logout());
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [dispatch]);

  const loginAction = useCallback(
    (email: string, password: string) => dispatch(login({ email, password })),
    [dispatch]
  );

  const logoutAction = useCallback(() => {
    dispatch(logout());
    window.location.href = "/login";
  }, [dispatch]);

  return {
    user,
    token,
    loading,
    initialized,
    error,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    login: loginAction,
    logout: logoutAction,
  };
};
