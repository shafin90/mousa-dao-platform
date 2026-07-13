import apiClient from "./apiClient";
import { extractList } from "./extractList";
import type { ApiResponse } from "@/shared/types";

export interface TicketData {
  _id: string;
  bookingId: { _id: string; bookingCode: string };
  userId: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  tripId: { _id: string; routeId: { fromStation: { name: string }; toStation: { name: string } }; departureTime: string; date: string };
  ticketNumber: string;
  qrCode: string;
  status: string;
  scannedAt?: string;
  createdAt: string;
}

export const ticketApi = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const { data } = await apiClient.get<{ data: unknown; pagination?: { total?: number } }>("/tickets", { params });
    const { items, total } = extractList<TicketData>(data, "tickets");
    return { tickets: items, total };
  },
  getById: async (id: string): Promise<TicketData> => {
    const { data } = await apiClient.get<ApiResponse<TicketData>>(`/tickets/${id}`);
    return data.data;
  },
  verify: async (ticketNumber: string): Promise<TicketData> => {
    const { data } = await apiClient.post<ApiResponse<TicketData>>("/tickets/verify", { ticketNumber });
    return data.data;
  },
  verifyById: async (ticketId: string): Promise<TicketData> => {
    const { data } = await apiClient.post<ApiResponse<TicketData>>("/tickets/verify", { ticketId });
    return data.data;
  },
};
