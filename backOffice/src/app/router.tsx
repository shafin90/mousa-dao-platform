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
const TripCreatePage = lazy(() => import("@/features/trips/pages/TripCreatePage"));
const TripEditPage = lazy(() => import("@/features/trips/pages/TripEditPage"));
const TripDetailsPage = lazy(() => import("@/features/trips/pages/TripDetailsPage"));
const FleetPage = lazy(() => import("@/features/fleet/pages/FleetPage"));
const FleetCreatePage = lazy(() => import("@/features/fleet/pages/FleetCreatePage"));
const BusDetailsPage = lazy(() => import("@/features/fleet/pages/BusDetailsPage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const EmployeesPage = lazy(() => import("@/features/users/pages/EmployeesPage"));
const EmployeeCreatePage = lazy(() => import("@/features/users/pages/EmployeeCreatePage"));
const EmployeeDetailsPage = lazy(() => import("@/features/users/pages/EmployeeDetailsPage"));
const PassengerDetailsPage = lazy(() => import("@/features/users/pages/PassengerDetailsPage"));
const AnalyticsPage = lazy(() => import("@/features/analytics/pages/AnalyticsPage"));
const RoutesPage = lazy(() => import("@/features/routes/pages/RoutesPage"));
const RouteCreatePage = lazy(() => import("@/features/routes/pages/RouteCreatePage"));
const RouteEditPage = lazy(() => import("@/features/routes/pages/RouteEditPage"));
const RouteDetailsPage = lazy(() => import("@/features/routes/pages/RouteDetailsPage"));
const StationsPage = lazy(() => import("@/features/stations/pages/StationsPage"));
const StationCreatePage = lazy(() => import("@/features/stations/pages/StationCreatePage"));
const StationDetailsPage = lazy(() => import("@/features/stations/pages/StationDetailsPage"));
const CitiesPage = lazy(() => import("@/features/cities/pages/CitiesPage"));
const CityCreatePage = lazy(() => import("@/features/cities/pages/CityCreatePage"));
const CityDetailsPage = lazy(() => import("@/features/cities/pages/CityDetailsPage"));
const TutorialPage = lazy(() => import("@/features/onboarding/pages/TutorialPage"));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/NotificationsPage"));
const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage"));
const ActivityLogPage = lazy(() => import("@/features/audit-logs/pages/AuditLogsPage"));
const SupportPage = lazy(() => import("@/features/support/pages/SupportPage"));
const ConversationPage = lazy(() => import("@/features/support/pages/ConversationPage"));

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
        path: "trips/new",
        element: <SuspenseWrapper><TripCreatePage /></SuspenseWrapper>,
      },
      {
        path: "trips/:id/edit",
        element: <SuspenseWrapper><TripEditPage /></SuspenseWrapper>,
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
        path: "fleet/new",
        element: <SuspenseWrapper><FleetCreatePage /></SuspenseWrapper>,
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
        path: "passengers/:id",
        element: <SuspenseWrapper><PassengerDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "employees",
        element: <SuspenseWrapper><EmployeesPage /></SuspenseWrapper>,
      },
      {
        path: "employees/new",
        element: <SuspenseWrapper><EmployeeCreatePage /></SuspenseWrapper>,
      },
      {
        path: "employees/:id",
        element: <SuspenseWrapper><EmployeeDetailsPage /></SuspenseWrapper>,
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
        path: "routes/new",
        element: <SuspenseWrapper><RouteCreatePage /></SuspenseWrapper>,
      },
      {
        path: "routes/:id/edit",
        element: <SuspenseWrapper><RouteEditPage /></SuspenseWrapper>,
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
        path: "stations/new",
        element: <SuspenseWrapper><StationCreatePage /></SuspenseWrapper>,
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
        path: "cities/new",
        element: <SuspenseWrapper><CityCreatePage /></SuspenseWrapper>,
      },
      {
        path: "cities/:id",
        element: <SuspenseWrapper><CityDetailsPage /></SuspenseWrapper>,
      },
      {
        path: "notifications",
        element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper>,
      },
      {
        path: "settings",
        element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper>,
      },
      {
        path: "tutorial",
        element: <SuspenseWrapper><TutorialPage /></SuspenseWrapper>,
      },
      {
        path: "activity-log",
        element: <SuspenseWrapper><ActivityLogPage /></SuspenseWrapper>,
      },
      {
        path: "support",
        element: <SuspenseWrapper><SupportPage /></SuspenseWrapper>,
      },
      {
        path: "support/:id",
        element: <SuspenseWrapper><ConversationPage /></SuspenseWrapper>,
      },
    ],
  },
]);
