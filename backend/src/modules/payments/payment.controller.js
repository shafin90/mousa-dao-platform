const paymentService = require('./payment.service');
const { publishToQueue, queues } = require('../../queue/index');
const { v4: uuidv4 } = require('uuid');
const auditService = require('../audit/audit.service');
const mongoose = require('mongoose');

const initiatePayment = async (req, res) => {
  try {
    const { bookingId, method } = req.body;
    const tx_ref = uuidv4();
    const eventId = uuidv4();

    await publishToQueue(queues.PAYMENT_QUEUE, {
      eventType: 'INITIATE_PAYMENT',
      eventId,
      companyId: req.user.companyId,
      tx_ref,
      bookingId,
      userId: req.user._id,
      method,
      timestamp: new Date()
    });

    res.status(202).json({
      success: true,
      message: 'Payment initiation request queued',
      data: {
        tx_ref,
        eventId
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const payments = await paymentService.getUserPayments(req.user._id, req.user.companyId);
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const data = await paymentService.getAllPayments(req.user.companyId, filters, parseInt(page) || 1, parseInt(limit) || 10);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    let payment;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await paymentService.getPaymentById(id, req.user.companyId);
    } else {
      payment = await paymentService.getPaymentByTxRef(id, req.user.companyId);
    }
    
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    
    if (req.user.role !== 'admin' && payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const eventId = uuidv4();
    const payload = req.body;
    const tx_ref = payload.data?.tx_ref;
    const transactionId = String(payload.data?.id || '');

    if (!tx_ref || !transactionId) {
      return res.status(400).json({ success: false, message: 'Missing transaction details in webhook payload' });
    }

    const payment = await paymentService.getPaymentByTxRef(tx_ref);
    const companyId = payment?.companyId || null;

    auditService.log({
      companyId,
      action: 'WEBHOOK_RECEIVED',
      module: 'PAYMENTS',
      description: `Webhook received from Flutterwave for tx_ref: ${tx_ref}`,
      metadata: { tx_ref, transactionId, event: payload.event },
      status: 'success'
    });

    await publishToQueue(queues.PAYMENT_WEBHOOK_QUEUE, {
      eventType: 'WEBHOOK_RECEIVED',
      eventId,
      companyId,
      tx_ref,
      transactionId,
      payload,
      timestamp: new Date()
    });

    res.status(202).json({
      success: true,
      message: 'Webhook received and queued for processing',
      eventId
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { initiatePayment, getUserPayments, getAllPayments, getPaymentById, handleWebhook };
