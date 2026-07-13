import { ticketApi } from './api/ticketApi';
import { Ticket } from '../data/types';

export const ticketService = {
  async getTicketsByUser(): Promise<Ticket[]> {
    const tickets = await ticketApi.getMy();
    return tickets.sort((a, b) => {
      const order: Record<string, number> = { valid: 0, used: 1, expired: 2, cancelled: 3 };
      return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    });
  },

  async getTicketById(id: string): Promise<Ticket | undefined> {
    return await ticketApi.getById(id);
  },
};
