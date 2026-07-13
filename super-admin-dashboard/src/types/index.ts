export interface Tenant {
  id: string;
  companyName: string;
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  totalRevenue: number;
  activeBuses: number;
  createdAt: string;
  email: string;
  phone: string;
  totalBookings: number;
}

export interface Booking {
  id: string;
  tenantId: string;
  tenantName: string;
  customerName: string;
  route: string;
  date: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  amount: number;
  seatNumber: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'successful' | 'pending' | 'failed' | 'refunded';
  method: string;
  createdAt: string;
  bookingId: string;
}

export interface RevenueData {
  date: string;
  amount: number;
  tenantId?: string;
}

export interface BookingTrend {
  date: string;
  count: number;
}

export interface GpsBus {
  id: string;
  tenantId: string;
  tenantName: string;
  busNumber: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  tripId: string;
  routeName: string;
  status: 'on_trip' | 'idle' | 'offline';
  lastUpdated: string;
}

export interface SystemStatus {
  apiUptime: number;
  activeWebSocketConnections: number;
  rabbitMQStatus: 'healthy' | 'degraded' | 'down';
  errorLogs: ErrorLog[];
  lastChecked: string;
}

export interface ErrorLog {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: string;
  source: string;
}

export interface DashboardKpi {
  totalTenants: number;
  totalRevenue: number;
  totalBookings: number;
  activeTrips: number;
  activeBuses: number;
  systemStatus: 'healthy' | 'degraded';
}

export interface TenantUsageStats {
  totalBookings: number;
  totalRevenue: number;
  activeBuses: number;
  activeTrips: number;
  monthlyGrowth: number;
 每日Revenue: RevenueData[];
}

export type PaymentStatus = 'successful' | 'pending' | 'failed' | 'refunded';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'refunded';
export type TenantPlan = 'basic' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'pending';
export type BusStatus = 'on_trip' | 'idle' | 'offline';
