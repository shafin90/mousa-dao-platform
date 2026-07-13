const paymentService = require('../services/payment.service');
const { publishToQueue, queues } = require('../../../queue/index');
const { v4: uuidv4 } = require('uuid');
const auditRepository = require('../../audit/repositories/audit.repository');
const mongoose = require('mongoose');
const { respond, respondPaginated, respondAccepted } = require('../../../utils/response');

/**
 * POST /payments/initiate
 * Queues a payment initiation request.
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;
    const txRef = uuidv4();
    const eventId = uuidv4();

    await publishToQueue(queues.PAYMENT_QUEUE, {
      eventType: 'INITIATE_PAYMENT',
      eventId,
      companyId: req.user.companyId,
      tx_ref: txRef,
      bookingId,
      userId: req.user._id,
      method,
      timestamp: new Date(),
    });

    respondAccepted(res, eventId, { tx_ref: txRef });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /payments/my
 */
const getUserPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getUserPayments(req.user._id, req.user.companyId);
    respond(res, 200, payments);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /payments
 */
const getAllPayments = async (req, res, next) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await paymentService.getAllPayments(req.user.companyId, filters, Number(page) || 1, Number(limit) || 10);
    respondPaginated(res, data.payments, data.total, Number(page) || 1, Number(limit) || 10);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let payment;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await paymentService.getPaymentById(id, req.user.companyId);
    } else {
      payment = await paymentService.getPaymentByTxRef(id, req.user.companyId);
    }
    if (!payment) return respond(res, 404, null, 'Payment not found');
    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString()) {
      return respond(res, 403, null, 'Unauthorized');
    }
    respond(res, 200, payment);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /payments/webhook
 * Receives Flutterwave webhook, queues for processing.
 */
const handleWebhook = async (req, res, next) => {
  try {
    const payload = req.body;
    const txRef = payload.data?.tx_ref;
    const transactionId = String(payload.data?.id || '');
    if (!txRef || !transactionId) return respond(res, 400, null, 'Missing transaction details');

    const payment = await paymentService.getPaymentByTxRef(txRef);
    const companyId = payment?.companyId || null;

    await auditRepository.create({
      companyId,
      action: 'WEBHOOK_RECEIVED',
      module: 'PAYMENTS',
      description: `Webhook from Flutterwave for ${txRef}`,
      metadata: { txRef, transactionId, event: payload.event },
      status: 'success',
    });

    const eventId = uuidv4();
    await publishToQueue(queues.PAYMENT_WEBHOOK_QUEUE, {
      eventType: 'WEBHOOK_RECEIVED',
      eventId,
      companyId,
      tx_ref: txRef,
      transactionId,
      payload,
      timestamp: new Date(),
    });

    respondAccepted(res, eventId);
  } catch (error) {
    next(error);
  }
};

module.exports = { initiatePayment, getUserPayments, getAllPayments, getPaymentById, handleWebhook };
