import { ticketApi } from "@/api/ticketApi";
import type { TicketData } from "@/api/ticketApi";

export const ticketService = {
  getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const result = await ticketApi.getAll(params);
    return result;
  },
  verify: async (ticketNumber: string): Promise<TicketData> => {
    return ticketApi.verify(ticketNumber);
  },
  verifyById: async (ticketId: string): Promise<TicketData> => {
    return ticketApi.verifyById(ticketId);
  },
};
