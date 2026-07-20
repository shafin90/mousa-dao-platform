/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";

const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const BookingsPage = lazy(() => import("@/features/bookings/pages/BookingsPage"));
const BookingDetailsPage = lazy(() => import("@/features/bookings/pages/BookingDetailsPage"));
const PaymentsPage = lazy(() => import("@/features/payments/pages/PaymentsPage"));
const TripsPage = lazy(() => import("@/features/trips/pages/TripsPage"));
const TripDetailsPage = lazy(() => import("@/features/trips/pages/TripDetailsPage"));
const FleetPage = lazy(() => import("@/features/fleet/pages/FleetPage"));
const BusDetailsPage = lazy(() => import("@/features/fleet/pages/BusDetailsPage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const AnalyticsPage = lazy(() => import("@/features/analytics/pages/AnalyticsPage"));
const RoutesPage = lazy(() => import("@/features/routes/pages/RoutesPage"));
const RouteDetailsPage = lazy(() => import("@/features/routes/pages/RouteDetailsPage"));
const StationsPage = lazy(() => import("@/features/stations/pages/StationsPage"));
const StationDetailsPage = lazy(() => import("@/features/stations/pages/StationDetailsPage"));
const CitiesPage = lazy(() => import("@/features/cities/pages/CitiesPage"));
const CityDetailsPage = lazy(() => import("@/features/cities/pages/CityDetailsPage"));
const MaintenancePage = lazy(() => import("@/features/maintenance/pages/MaintenancePage"));
const MaintenanceDetailsPage = lazy(() => import("@/features/maintenance/pages/MaintenanceDetailsPage"));
const TutorialPage = lazy(() => import("@/features/onboarding/pages/TutorialPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper>,
      },
      {
        path: "bookings",
        element: <SuspenseWrapper><BookingsPage /></SuspenseWrapper>,
      },
      {
        path: "bookings/:id",
        element: <SuspenseWrapper><BookingDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "payments",
        element: <SuspenseWrapper><PaymentsPage /></SuspenseWrapper>,
      },
      {
        path: "trips",
        element: <SuspenseWrapper><TripsPage /></SuspenseWrapper>,
      },
      {
        path: "trips/:id",
        element: <SuspenseWrapper><TripDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "fleet",
        element: <SuspenseWrapper><FleetPage /></SuspenseWrapper>,
      },
      {
        path: "fleet/:id",
        element: <SuspenseWrapper><BusDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "passengers",
        element: <SuspenseWrapper><UsersPage /></SuspenseWrapper>,
      },
      {
        path: "analytics",
        element: <SuspenseWrapper><AnalyticsPage /></SuspenseWrapper>,
      },
      {
        path: "routes",
        element: <SuspenseWrapper><RoutesPage /></SuspenseWrapper>,
      },
      {
        path: "routes/:id",
        element: <SuspenseWrapper><RouteDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "stations",
        element: <SuspenseWrapper><StationsPage /></SuspenseWrapper>,
      },
      {
        path: "stations/:id",
        element: <SuspenseWrapper><StationDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "cities",
        element: <SuspenseWrapper><CitiesPage /></SuspenseWrapper>,
      },
      {
        path: "cities/:id",
        element: <SuspenseWrapper><CityDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "maintenance-records",
        element: <SuspenseWrapper><MaintenancePage /></SuspenseWrapper>,
      },
      {
        path: "maintenance-records/:id",
        element: <SuspenseWrapper><MaintenanceDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "tutorial",
        element: <SuspenseWrapper><TutorialPage /></SuspenseWrapper>,
      },
    ],
  },
]);
