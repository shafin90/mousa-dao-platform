const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../bookings/models/Booking');
const bookingService = require('../bookings/services/booking.service');
const paymentService = require('../payments/services/payment.service');
const { respond } = require('../../utils/response');

const createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const companyId = req.user.companyId;

    const booking = await Booking.findOne({ _id: bookingId, companyId });
    if (!booking) return respond(res, 404, null, 'Booking not found');
    if (booking.paymentStatus === 'paid') return respond(res, 400, null, 'Booking already paid');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: 'bdt',
      metadata: {
        bookingId: booking._id.toString(),
        companyId: companyId.toString(),
        userId: req.user._id.toString(),
      },
    });

    respond(res, 200, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    next(error);
  }
};

const createBookingPayment = async (req, res, next) => {
  try {
    const { tripId, seats, passengers } = req.body;
    const userId = req.user._id;
    const companyId = req.user.companyId;

    const booking = await bookingService.processBooking(userId, companyId, { tripId, seats, passengers: passengers || [] });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalAmount * 100),
      currency: 'bdt',
      metadata: {
        bookingId: booking._id.toString(),
        companyId: companyId.toString(),
        userId: userId.toString(),
      },
    });

    respond(res, 200, {
      clientSecret: paymentIntent.client_secret,
      bookingId: booking._id,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return respond(res, 400, null, `Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { bookingId, companyId } = paymentIntent.metadata;

    try {
      if (bookingId && companyId) {
        await paymentService.processStripePaymentSuccess(
          bookingId,
          companyId,
          paymentIntent.id,
        );
      }
    } catch (err) {
      console.error('Stripe webhook processing error:', err);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const { bookingId, companyId, userId } = paymentIntent.metadata;

    try {
      if (bookingId && companyId && userId) {
        await paymentService.processStripePaymentFailed(bookingId, companyId, userId);
      }
    } catch (err) {
      console.error('Stripe webhook failure handling error:', err);
    }
  }

  res.json({ received: true });
};

module.exports = { createPaymentIntent, createBookingPayment, handleWebhook };
