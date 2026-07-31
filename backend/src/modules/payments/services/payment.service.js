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
 * Step 1: Confirm booking to completed + paid
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

  await publishPostPaymentEvents(updatedBooking);

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
 * Publishes ticket generation and customer notification events after payment.
 *
 * @param {Object} booking - Completed booking document
 * @returns {Promise<void>}
 */
const publishPostPaymentEvents = async (booking) => {
  await publishToQueue(queues.TICKET_QUEUE, {
    eventType: 'TICKET_READY',
    companyId: booking.companyId,
    bookingId: booking._id,
    eventId: uuidv4(),
  });

  const notifications = [
    {
      eventType: 'PAYMENT_SUCCESS',
      type: 'payment',
      title: 'Paiement réussi',
      message: 'Votre paiement a été accepté.',
    },
    {
      eventType: 'BOOKING_COMPLETED',
      type: 'booking',
      title: 'Réservation confirmée',
      message: 'Votre réservation est confirmée.',
    },
  ];

  for (const n of notifications) {
    await publishToQueue(queues.NOTIFICATION_QUEUE, {
      ...n,
      companyId: booking.companyId,
      bookingId: booking._id,
      userId: booking.userId,
      eventId: uuidv4(),
    });
  }
};

/**
 * Completes a booking after Stripe payment (idempotent if already paid).
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @param {string} [paymentIntentId]
 * @returns {Promise<Object|null>} Updated booking, or null if already completed
 */
const processStripePaymentSuccess = async (bookingId, companyId, paymentIntentId) => {
  const updatedBooking = await bookingRepository.confirmPayment(bookingId, companyId);
  if (!updatedBooking) return null;

  await publishPostPaymentEvents(updatedBooking);

  await auditRepository.create({
    companyId,
    userId: updatedBooking.userId,
    action: 'PAYMENT_SUCCESS',
    module: 'PAYMENTS',
    description: `Stripe payment succeeded for booking ${bookingId}`,
    metadata: { paymentIntentId, bookingId: updatedBooking._id },
    status: 'success',
  });

  return updatedBooking;
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

  const notifyUserId = userId || updatedBooking?.userId;
  if (notifyUserId) {
    await publishToQueue(queues.NOTIFICATION_QUEUE, {
      eventType: 'PAYMENT_FAILED',
      type: 'payment',
      title: 'Échec du paiement',
      message: 'Le paiement n\'a pas abouti. Votre réservation a été annulée.',
      companyId,
      bookingId,
      userId: notifyUserId,
      eventId: uuidv4(),
    });
  }

  await auditRepository.create({
    companyId,
    userId: notifyUserId,
    action: 'PAYMENT_FAILED',
    module: 'PAYMENTS',
    description: `Payment failed for tx_ref ${txRef}`,
    metadata: { txRef, transactionId },
    status: 'failed',
  });
};

/**
 * Handles Stripe payment failure — cancels booking and notifies customer.
 *
 * @param {string} bookingId
 * @param {string} companyId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const processStripePaymentFailed = async (bookingId, companyId, userId) => {
  await processFailedPayment(bookingId, companyId, `stripe:${bookingId}`, null, userId);
};

/**
 * Lists payments for a user within company.
 *
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<Array>}
 */
const retryPayment = async (bookingId, userId, companyId) => {
  const booking = await bookingRepository.findById(bookingId, companyId);
  if (!booking) throw new AppError('Booking not found', 404, ErrorCodes.BOOKING_NOT_FOUND);
  if (booking.userId.toString() !== String(userId)) throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
  if (booking.status !== 'pending') throw new AppError('Booking is not in pending state', 400, ErrorCodes.BOOKING_NOT_FOUND);
  if (!['unpaid', 'failed'].includes(booking.paymentStatus)) throw new AppError('Payment cannot be retried', 400, ErrorCodes.PAYMENT_INVALID_TRANSITION);

  const txRef = uuidv4();
  const eventId = uuidv4();

  await publishToQueue(queues.PAYMENT_QUEUE, {
    eventType: 'RETRY_PAYMENT',
    eventId,
    companyId,
    tx_ref: txRef,
    bookingId,
    userId,
    timestamp: new Date(),
  });

  return { eventId, tx_ref: txRef };
};

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

/**
 * Fetches a payment by tx_ref (any company — used by webhook).
 *
 * @param {string} txRef
 * @returns {Promise<Object|null>}
 */
const getPaymentByTxRefAny = async (txRef) => {
  return await paymentRepository.findByTxRefAny(txRef);
};

module.exports = {
  initiatePaymentFlow,
  processSuccessfulPayment,
  publishPostPaymentEvents,
  processStripePaymentSuccess,
  processStripePaymentFailed,
  processFailedPayment,
  retryPayment,
  getUserPayments,
  getAllPayments,
  getPaymentById,
  getPaymentByTxRef,
  getPaymentByTxRefAny,
};
