export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: string;
  companyId?: string;
  createdAt: string;
}

export interface Bus {
  id: string;
  name: string;
  plateNumber: string;
  capacity: number;
  amenities: string[];
  busType: 'standard' | 'luxury' | 'sleeper';
}

export interface Station {
  id: string;
  name: string;
  code: string;
  location: { lat: number; lng: number };
  address: string;
  cityId?: string;
}

export interface Trip {
  id: string;
  routeId?: string;
  busId?: string;
  busName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  seatsTotal?: number;
  seatsBooked?: number;
  status: string;
}

export interface Seat {
  id: string;
  number: string;
  isBooked: boolean;
  isSelected: boolean;
}

export interface Booking {
  id: string;
  userId?: string;
  tripId: string;
  seats: string[];
  totalAmount?: number;
  totalPrice?: number;
  status: BookingStatus;
  bookingDate: string;
  paymentStatus?: string;
  paymentId?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Ticket {
  id: string;
  bookingId: string;
  userId?: string;
  tripId: string;
  seatNumber?: string;
  passengerName?: string;
  qrCode: string;
  ticketNumber?: string;
  status: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId?: string;
  amount: number;
  method: string;
  status: string;
  tx_ref?: string;
  transactionDate: string;
  createdAt?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface TripSearchParams {
  origin?: string;
  destination?: string;
  date?: string;
}
