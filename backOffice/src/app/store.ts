import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import authReducer from "@/features/auth/store/authSlice";
import dashboardReducer from "@/features/dashboard/store/dashboardSlice";
import bookingReducer from "@/features/bookings/store/bookingSlice";
import tripReducer from "@/features/trips/store/tripSlice";
import fleetReducer from "@/features/fleet/store/fleetSlice";
import userReducer from "@/features/users/store/userSlice";
import routeReducer from "@/features/routes/store/routeSlice";
import ticketReducer from "@/features/tickets/store/ticketSlice";
import auditLogReducer from "@/features/audit-logs/store/auditLogSlice";
import notificationReducer from "@/features/notifications/store/notificationSlice";
import configReducer from "@/features/config/store/configSlice";
import analyticsReducer from "@/features/analytics/store/analyticsSlice";
import stationReducer from "@/features/stations/store/stationSlice";
import paymentReducer from "@/features/payments/store/paymentSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    bookings: bookingReducer,
    trips: tripReducer,
    fleet: fleetReducer,
    users: userReducer,
    routes: routeReducer,
    tickets: ticketReducer,
    auditLogs: auditLogReducer,
    notifications: notificationReducer,
    config: configReducer,
    analytics: analyticsReducer,
    stations: stationReducer,
    payments: paymentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
