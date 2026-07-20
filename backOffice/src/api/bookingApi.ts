import apiClient from "./apiClient";
import { extractList } from "./extractList";
import type { ApiResponse } from "@/shared/types";

// interface StationInfo {
//   _id: string;
//   name: string;
//   location: { lat: number; lng: number };
// }

export interface BookingData {
  _id: string;
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string; phone: string };
  tripId: { _id: string; routeId: { _id: string; fromCity: { _id: string; name: string }; toCity: { _id: string; name: string } }; busId: { busNumber: string }; departureTime: string; arrivalTime: string; date: string; price: number; seatsTotal: number; seatsBooked: number; status: string };
  seats: string[];
  bookingCode: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  tripId?: string;
}

export const bookingApi = {
  getAll: async (params?: BookingFilters) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/bookings", { params });
    const { items, total } = extractList<BookingData>(data, "bookings");
    return { bookings: items, total };
  },
  getById: async (id: string): Promise<BookingData> => {
    const { data } = await apiClient.get<ApiResponse<BookingData>>(`/bookings/${id}`);
    return data.data;
  },
  create: async (payload: { tripId: string; seats: string[] }) => {
    const { data } = await apiClient.post<ApiResponse<BookingData>>("/bookings", payload);
    return data.data;
  },
  cancel: async (id: string): Promise<BookingData> => {
    const { data } = await apiClient.patch<ApiResponse<BookingData>>(`/bookings/${id}/cancel`);
    return data.data;
  },
};
