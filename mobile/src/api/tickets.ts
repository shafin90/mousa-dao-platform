import apiClient from './client';
import { Ticket } from '../types';

export const getMyTickets = async () => {
  const res = await apiClient.get('/tickets/my');
  return res.data.data as Ticket[];
};

export const getTicketById = async (id: string) => {
  const res = await apiClient.get(`/tickets/${id}`);
  return res.data.data as Ticket;
};
