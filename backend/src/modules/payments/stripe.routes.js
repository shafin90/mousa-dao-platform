const express = require('express');
const stripeController = require('./stripe.controller');
const { authenticate } = require('../auth/auth.middleware');

// Webhook route — mounted before express.json() in app.js
const webhookRouter = express.Router();
webhookRouter.post('/', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

// Protected routes — mounted after express.json()
const apiRouter = express.Router();
apiRouter.use(authenticate);
apiRouter.post('/create-intent', stripeController.createPaymentIntent);
apiRouter.post('/create-booking-payment', stripeController.createBookingPayment);

module.exports = { webhookRouter, apiRouter };
