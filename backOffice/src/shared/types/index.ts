export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  user: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
  token: string;
}

export interface User {
  _id: string;
  email: string;
  phone: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  authTracking: {
    lastLogin?: string;
    failedLoginAttempts: number;
    isLocked: boolean;
  };
  createdAt: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  totalTrips: number;
  totalUsers: number;
  activeBuses: number;
  occupancyRate: number;
}

export interface Booking {
  _id: string;
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string; phone: string };
  tripId: {
    _id: string;
    routeId: { _id: string; fromCity: { name: string }; toCity: { name: string } };
    busId: { busNumber: string };
    departureTime: string;
    arrivalTime: string;
    date: string;
    price: number;
    seatsTotal: number;
    seatsBooked: number;
    status: string;
  };
  seats: string[];
  bookingCode: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface Trip {
  _id: string;
  routeId: {
    _id: string;
    fromCity: { _id: string; name: string };
    toCity: { _id: string; name: string };
    distanceKm: number;
    estimatedTimeMinutes: number;
  };
  busId: { _id: string; busNumber: string; name: string; capacity: number; type: string };
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number;
  seatsTotal: number;
  seatsBooked: number;
  status: string;
  createdAt: string;
}

export interface Route {
  _id: string;
  fromCity: { _id: string; name: string };
  toCity: { _id: string; name: string };
  distanceKm: number;
  estimatedTimeMinutes: number;
  createdAt: string;
}

export interface Bus {
  _id: string;
  busNumber: string;
  name: string;
  capacity: number;
  type: string;
  assignedDriver?: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  status: string;
  features: Record<string, unknown>;
  createdAt: string;
}

export interface Payment {
  _id: string;
  bookingId: { _id: string; bookingCode: string };
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  method: string;
  transactionId?: string;
  tx_ref: string;
  paymentLink?: string;
  amount?: number;
  status: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  bookingId: { _id: string; bookingCode: string };
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  tripId: { _id: string; routeId: { fromCity: { name: string }; toCity: { name: string } }; departureTime: string; date: string };
  ticketNumber: string;
  qrCode: string;
  status: string;
  scannedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userId: { _id: string; email: string };
  action: string;
  module: string;
  description: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  status: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemConfig {
  _id: string;
  baseCurrency: string;
  timezone: string;
  platformCommissionPercentage: number;
  driverCommissionPercentage: number;
  taxPercentage: number;
  maintenanceMode: boolean;
  featureFlags: { enableBooking: boolean; enablePayments: boolean; enableTicketing: boolean };
  pricingRules: { defaultBaseFareMultiplier: number; vipMultiplier: number };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages?: number;
}
