import { create } from 'zustand';
import { Ticket } from '../data/types';

interface TicketState {
  tickets: Ticket[];
  isLoading: boolean;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  isLoading: false,
  setTickets: (tickets) => set({ tickets }),
  setLoading: (isLoading) => set({ isLoading }),
}));
