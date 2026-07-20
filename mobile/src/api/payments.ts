import apiClient from './client';

export const createPaymentIntent = async (data: {
  bookingId: string;
}) => {
  const res = await apiClient.post('/payments/stripe/create-intent', data);
  return res.data.data as { clientSecret: string; paymentIntentId: string };
};

export const getMyPayments = async () => {
  const res = await apiClient.get('/payments/my');
  return res.data.data;
};
