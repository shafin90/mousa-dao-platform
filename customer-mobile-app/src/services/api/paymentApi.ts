import apiClient from './client';
import { Payment } from '../../data/types';

type PaymentMethod = 'wave' | 'orange_money' | 'mtn' | 'moov' | 'flutterwave';

export const paymentApi = {
  initiate: async (payload: { bookingId: string; method: PaymentMethod }): Promise<{ eventId: string; tx_ref: string }> => {
    const { data } = await apiClient.post('/payments/initiate', payload);
    return data.data;
  },
  getMy: async (): Promise<Payment[]> => {
    const { data } = await apiClient.get('/payments/my');
    return (data.data || []).map((p: any) => ({
      id: p._id || p.id,
      bookingId: p.bookingId,
      userId: p.userId,
      amount: p.amount,
      method: p.method,
      status: p.status,
      tx_ref: p.tx_ref,
      transactionDate: p.createdAt || p.transactionDate,
      createdAt: p.createdAt,
    }));
  },
  getByTxRef: async (txRef: string): Promise<Payment> => {
    const { data } = await apiClient.get(`/payments/${txRef}`);
    const p = data.data;
    return {
      id: p._id || p.id,
      bookingId: p.bookingId,
      userId: p.userId,
      amount: p.amount,
      method: p.method,
      status: p.status,
      tx_ref: p.tx_ref,
      transactionDate: p.createdAt,
      createdAt: p.createdAt,
    };
  },
};
