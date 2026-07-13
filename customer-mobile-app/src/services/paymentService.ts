import { paymentApi } from './api/paymentApi';
import { Payment } from '../data/types';

export type PaymentMethod = 'wave' | 'orange_money' | 'mtn' | 'moov' | 'flutterwave';

export const paymentService = {
  async processPayment(data: { bookingId: string; userId: string; amount: number; method: PaymentMethod }): Promise<Payment> {
    const result = await paymentApi.initiate({
      bookingId: data.bookingId,
      method: data.method,
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    const payment = await paymentApi.getByTxRef(result.tx_ref);
    return {
      id: payment.id,
      bookingId: data.bookingId,
      amount: data.amount,
      method: data.method,
      status: payment.status || 'processing',
      tx_ref: result.tx_ref,
      transactionDate: new Date().toISOString(),
    };
  },

  async getPaymentsByUser(): Promise<Payment[]> {
    return await paymentApi.getMy();
  },
};
