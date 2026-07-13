const paymentRepository = require('../repositories/payment.repository');
const bookingRepository = require('../../bookings/repositories/booking.repository');
const tripRepository = require('../../trips/repositories/trip.repository');
const ProviderFactory = require('../providers/provider.factory');
const auditRepository = require('../../audit/repositories/audit.repository');
const { publishToQueue, queues } = require('../../../queue/index');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../../../errors/AppError');
const ErrorCodes = require('../../../errors/errorCodes');

/**
 * Initiates a payment record and calls the payment provider.
 *
 * FLOW:
 * Step 1: Validate booking exists and is in pending state
 * Step 2: Create payment record with pending status
 * Step 3: Initialize payment with provider (Flutterwave)
 * Step 4: Update payment to processing with payment link
 * Step 5: Audit the initiation
 *
 * @param {string} txRef
 * @param {string} bookingId
 * @param {string} userId
 * @param {string} companyId
 * @param {string} method
 * @returns {Promise<Object>} { payment, booking, paymentLink }
 */
const initiatePaymentFlow = async (txRef, bookingId, userId, companyId, method) => {
  const booking = await bookingRepository.findById(bookingId, companyId);
  if (!booking) throw new AppError('Booking not found', 404, ErrorCodes.BOOKING_NOT_FOUND);
  if (booking.status !== 'pending') throw new AppError('Booking is not in pending state', 400, ErrorCodes.BOOKING_NOT_FOUND);
  if (booking.paymentStatus === 'paid') throw new AppError('Booking is already paid', 409, ErrorCodes.BOOKING_ALREADY_PAID);

  const payment = await paymentRepository.create({ companyId, bookingId, userId, method, tx_ref: txRef, status: 'pending' });
  return { payment, booking };
};

/**
 * Processes a successful payment webhook.
 *
 * FLOW:
 * Step 1: Confirm booking to confirmed + paid
 * Step 2: Publish ticket generation event
 * Step 3: Publish success notifications
 * Step 4: Audit success
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @param {string} txRef
 * @param {string} transactionId
 * @returns {Promise<void>}
 */
const processSuccessfulPayment = async (bookingId, companyId, txRef, transactionId) => {
  const updatedBooking = await bookingRepository.confirmPayment(bookingId, companyId);
  if (!updatedBooking) throw new AppError('Atomic booking confirmation failed', 409, ErrorCodes.CONFLICT);

  await publishToQueue(queues.TICKET_QUEUE, {
    eventType: 'TICKET_READY',
    companyId,
    bookingId: updatedBooking._id,
    eventId: uuidv4(),
  });

  for (const eventType of ['PAYMENT_SUCCESS', 'BOOKING_CONFIRMED']) {
    await publishToQueue(queues.NOTIFICATION_QUEUE, {
      eventType,
      companyId,
      bookingId: updatedBooking._id,
      userId: updatedBooking.userId,
      eventId: uuidv4(),
    });
  }

  await auditRepository.create({
    companyId,
    userId: updatedBooking.userId,
    action: 'PAYMENT_SUCCESS',
    module: 'PAYMENTS',
    description: `Payment succeeded for tx_ref ${txRef}`,
    metadata: { txRef, transactionId, bookingId: updatedBooking._id },
    status: 'success',
  });
};

/**
 * Processes a failed payment — cancels booking and releases seats.
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @param {string} txRef
 * @param {string} transactionId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const processFailedPayment = async (bookingId, companyId, txRef, transactionId, userId) => {
  const updatedBooking = await bookingRepository.updateOne(
    bookingId, companyId, { $set: { status: 'cancelled' } }
  );
  if (updatedBooking) {
    await tripRepository.incrementSeats(updatedBooking.tripId, -updatedBooking.seats.length);
  }
  await auditRepository.create({
    companyId,
    userId,
    action: 'PAYMENT_FAILED',
    module: 'PAYMENTS',
    description: `Payment failed for tx_ref ${txRef}`,
    metadata: { txRef, transactionId },
    status: 'failed',
  });
};

/**
 * Lists payments for a user within company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const getUserPayments = async (userId, companyId) => {
  return await paymentRepository.findByUser(userId, companyId);
};

/**
 * Lists all payments for a company with pagination.
 *
 * @param {string} companyId
 * @param {Object} filters
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>}
 */
const getAllPayments = async (companyId, filters, page, limit) => {
  return await paymentRepository.findMany(companyId, filters, page, limit);
};

/**
 * Fetches a payment by ID or tx_ref within company.
 *
 * @param {string} id
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getPaymentById = async (id, companyId) => {
  return await paymentRepository.findById(id, companyId);
};

/**
 * Fetches a payment by tx_ref within company.
 *
 * @param {string} txRef
 * @param {string} companyId
 * @returns {Promise<Object|null>}
 */
const getPaymentByTxRef = async (txRef, companyId) => {
  return await paymentRepository.findByTxRef(txRef, companyId);
};

module.exports = {
  initiatePaymentFlow,
  processSuccessfulPayment,
  processFailedPayment,
  getUserPayments,
  getAllPayments,
  getPaymentById,
  getPaymentByTxRef,
};
