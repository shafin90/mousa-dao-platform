import { useEffect, useState, useCallback } from 'react';
import { ticketService } from '../services/ticketService';
import { Ticket } from '../data/types';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ticketService.getTicketsByUser();
      setTickets(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const getTicketById = useCallback(async (id: string) => {
    return await ticketService.getTicketById(id);
  }, []);

  const activeTickets = tickets.filter(t => t.status === 'valid');
  const pastTickets = tickets.filter(t => t.status !== 'valid');

  return { tickets, activeTickets, pastTickets, isLoading, fetchTickets, getTicketById };
}
