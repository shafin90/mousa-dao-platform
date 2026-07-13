import { useState, useCallback } from 'react';
import { paymentService, PaymentMethod } from '../services/paymentService';
import { useBookingStore } from '../store/bookingStore';

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const booking = useBookingStore((s) => s.booking);

  const processPayment = useCallback(async (method: PaymentMethod) => {
    if (!booking) return;
    setIsProcessing(true);
    try {
      const payment = await paymentService.processPayment({
        bookingId: booking.id,
        userId: '',
        amount: booking.totalAmount || booking.totalPrice || 0,
        method,
      });
      return payment;
    } finally {
      setIsProcessing(false);
    }
  }, [booking]);

  const getPaymentHistory = useCallback(async () => {
    return await paymentService.getPaymentsByUser();
  }, []);

  return {
    booking,
    isProcessing,
    processPayment,
    getPaymentHistory,
  };
}
