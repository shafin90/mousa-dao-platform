import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { store, useAppDispatch } from "@/app/store";
import { router } from "@/app/router";
import { fetchMe, setInitialized } from "@/features/auth/store/authSlice";
import { Toaster } from "sonner";
import { ErrorProvider } from "@/shared/contexts/ErrorContext";
import "@/shared/i18n";

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = store.getState().auth.token;
    if (token) {
      dispatch(fetchMe());
    } else {
      dispatch(setInitialized());
    }
  }, [dispatch]);

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
      <ErrorProvider>
        <Toaster position="top-right" richColors />
        <AppInner />
      </ErrorProvider>
    </Provider>
  );
};
