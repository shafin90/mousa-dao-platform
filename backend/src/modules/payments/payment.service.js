const Payment = require('./models/Payment');
const Booking = require('../bookings/models/Booking');

const VALID_TRANSITIONS = {
  'pending': ['processing', 'success', 'failed', 'expired'],
  'processing': ['success', 'failed', 'expired'],
  'success': ['refunded'],
  'failed': [],
  'refunded': [],
  'expired': []
};

const validateStatusTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new Error(`Invalid payment status transition from ${currentStatus} to ${nextStatus}`);
  }
};

const initiatePayment = async (tx_ref, bookingId, userId, companyId, method) => {
  const booking = await Booking.findOne({ _id: bookingId, companyId });
  if (!booking) throw new Error('Booking not found');
  if (booking.status !== 'pending') throw new Error('Booking is not in pending state');
  if (booking.paymentStatus === 'paid') throw new Error('Booking is already paid');

  const payment = await Payment.create({
    companyId,
    bookingId,
    userId,
    method,
    tx_ref,
    status: 'pending'
  });

  return { payment, booking };
};

const getUserPayments = async (userId, companyId) => {
  return await Payment.find({ userId, companyId });
};

const getAllPayments = async (companyId, filters, page = 1, limit = 10) => {
  const query = { companyId };
  if (filters.status) {
    const statuses = filters.status.split(',');
    query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (filters.method) query.method = filters.method;
  if (filters.userId) query.userId = filters.userId;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('userId bookingId');
  
  const total = await Payment.countDocuments(query);
  return { payments, total };
};

const getPaymentById = async (id, companyId) => {
  return await Payment.findOne({ _id: id, companyId });
};

const getPaymentByTxRef = async (tx_ref, companyId) => {
  return await Payment.findOne({ tx_ref, companyId });
};

module.exports = { 
  initiatePayment, 
  getUserPayments, 
  getAllPayments, 
  getPaymentById, 
  getPaymentByTxRef,
  validateStatusTransition 
};
