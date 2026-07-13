/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";

const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const BookingsPage = lazy(() => import("@/features/bookings/pages/BookingsPage"));
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
const CitiesPage = lazy(() => import("@/features/cities/pages/CitiesPage"));
const MaintenanceFacilitiesPage = lazy(() => import("@/features/maintenance-facilities/pages/MaintenanceFacilitiesPage"));
const MaintenanceStaffPage = lazy(() => import("@/features/maintenance-staff/pages/MaintenanceStaffPage"));
const MaintenanceRecordsPage = lazy(() => import("@/features/maintenance-records/pages/MaintenanceRecordsPage"));
const MaintenanceLayout = lazy(() => import("@/features/maintenance/layouts/MaintenanceLayout"));
const MaintenanceDashboardPage = lazy(() => import("@/features/maintenance/pages/MaintenanceDashboardPage"));
const MaintenanceSchedulePage = lazy(() => import("@/features/maintenance/pages/MaintenanceSchedulePage"));
const WorkOrdersPage = lazy(() => import("@/features/maintenance/pages/WorkOrdersPage"));
const ComingSoon = lazy(() => import("@/features/maintenance/components/ComingSoon"));
const TicketsPage = lazy(() => import("@/features/tickets/pages/TicketsPage"));
const AuditLogsPage = lazy(() => import("@/features/audit-logs/pages/AuditLogsPage"));
const NotificationsPage = lazy(() => import("@/features/notifications/pages/NotificationsPage"));
const ConfigPage = lazy(() => import("@/features/config/pages/ConfigPage"));
const LiveTrackingPage = lazy(() => import("@/features/tracking/pages/LiveTrackingPage"));

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
        path: "users",
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
        path: "cities",
        element: <SuspenseWrapper><CitiesPage /></SuspenseWrapper>,
      },
      {
        path: "maintenance",
        element: <SuspenseWrapper><MaintenanceLayout /></SuspenseWrapper>,
        children: [
          { index: true, element: <Navigate to="/maintenance/dashboard" replace /> },
          { path: "dashboard", element: <SuspenseWrapper><MaintenanceDashboardPage /></SuspenseWrapper> },
          { path: "schedule", element: <SuspenseWrapper><MaintenanceSchedulePage /></SuspenseWrapper> },
          { path: "work-orders", element: <SuspenseWrapper><WorkOrdersPage /></SuspenseWrapper> },
          { path: "history", element: <SuspenseWrapper><MaintenanceRecordsPage /></SuspenseWrapper> },
          { path: "facilities", element: <SuspenseWrapper><MaintenanceFacilitiesPage /></SuspenseWrapper> },
          { path: "staff", element: <SuspenseWrapper><MaintenanceStaffPage /></SuspenseWrapper> },
          { path: "breakdowns", element: <SuspenseWrapper><ComingSoon titleKey="maintenance.nav.breakdowns" /></SuspenseWrapper> },
          { path: "spare-parts", element: <SuspenseWrapper><ComingSoon titleKey="maintenance.nav.spareParts" /></SuspenseWrapper> },
          { path: "cost", element: <SuspenseWrapper><ComingSoon titleKey="maintenance.nav.cost" /></SuspenseWrapper> },
          { path: "documents", element: <SuspenseWrapper><ComingSoon titleKey="maintenance.nav.documents" /></SuspenseWrapper> },
          { path: "reminders", element: <SuspenseWrapper><ComingSoon titleKey="maintenance.nav.reminders" /></SuspenseWrapper> },
        ],
      },
      {
        path: "maintenance-facilities",
        element: <Navigate to="/maintenance/facilities" replace />,
      },
      {
        path: "maintenance-staff",
        element: <Navigate to="/maintenance/staff" replace />,
      },
      {
        path: "maintenance-records",
        element: <Navigate to="/maintenance/history" replace />,
      },
      {
        path: "tickets",
        element: <SuspenseWrapper><TicketsPage /></SuspenseWrapper>,
      },
      {
        path: "audit-logs",
        element: <SuspenseWrapper><AuditLogsPage /></SuspenseWrapper>,
      },
      {
        path: "notifications",
        element: <SuspenseWrapper><NotificationsPage /></SuspenseWrapper>,
      },
      {
        path: "config",
        element: <SuspenseWrapper><ConfigPage /></SuspenseWrapper>,
      },
      {
        path: "tracking",
        element: <SuspenseWrapper><LiveTrackingPage /></SuspenseWrapper>,
      },
    ],
  },
]);
