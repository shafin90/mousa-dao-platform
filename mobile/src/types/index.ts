export interface User {
  _id: string;
  email?: string;
  phone: string;
  role: 'admin' | 'staff' | 'driver' | 'customer';
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  companyId: string;
}

export interface Trip {
  _id: string;
  companyId: string;
  routeId: Route;
  fromStation: Station;
  toStation: Station;
  busId: Bus;
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number;
  seatsTotal: number;
  seatsBooked: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface Route {
  _id: string;
  companyId: string;
  fromStation: Station;
  toStation: Station;
  distanceKm: number;
  estimatedTimeMinutes: number;
}

export interface Station {
  _id: string;
  name: string;
  cityId?: City;
  address?: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface City {
  _id: string;
  name: string;
  country: string;
  location?: { lat: number; lng: number };
}

export interface Bus {
  _id: string;
  busNumber: string;
  name: string;
  capacity: number;
  type: 'VIP' | 'Premium' | 'Mini' | 'Standard';
  status: 'active' | 'maintenance' | 'inactive';
  features: Record<string, any>;
}

export interface Booking {
  _id: string;
  companyId: string;
  userId: string;
  tripId: Trip;
  seats: string[];
  bookingCode: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
}

export interface Ticket {
  _id: string;
  companyId: string;
  bookingId: string;
  userId: string;
  tripId: string;
  ticketNumber: string;
  qrCode: string;
  status: 'valid' | 'used' | 'expired';
}

export interface Payment {
  _id: string;
  companyId: string;
  bookingId: string;
  userId: string;
  amount: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
  method: string;
  tx_ref: string;
}

export interface Notification {
  _id: string;
  companyId: string;
  userId: string;
  type: 'booking' | 'payment' | 'system' | 'trip';
  message: string;
  key: string;
  isRead: boolean;
  createdAt: string;
}

export interface SeatAvailability {
  seatNumber: string;
  isBooked: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
