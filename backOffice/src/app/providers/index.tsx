import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store, useAppDispatch } from "@/app/store";
import { router } from "@/app/router";
import { fetchMe } from "@/features/auth/store/authSlice";
import { Toaster } from "sonner";
import "@/shared/i18n";

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { token } = store.getState().auth;

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  return <>{children}</>;
};

const AppInner: React.FC = () => {
  return (
    <AuthInitializer>
      <RouterProvider router={router} />
    </AuthInitializer>
  );
};

export const AppProviders: React.FC = () => {
  return (
    <Provider store={store}>
      <Toaster position="top-right" richColors />
      <AppInner />
    </Provider>
  );
};
