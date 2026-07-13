const express = require('express');
const router = express.Router();
const paymentController = require('./controllers/payment.controller');
const validate = require('../../middlewares/validate.middleware');
const { initiatePaymentSchema } = require('./validators/payment.validator');
const { authenticate, requireRole } = require('../auth/auth.middleware');
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many payment requests' },
});

router.post('/webhook', (req, res, next) => {
  const signature = req.headers['verif-hash'];
  if (!signature || signature !== process.env.FLW_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
  }
  next();
}, paymentController.handleWebhook);

router.use(authenticate);

router.post('/initiate', paymentLimiter, validate(initiatePaymentSchema), paymentController.initiatePayment);
router.get('/my', paymentController.getUserPayments);
router.get('/', requireRole(['admin']), paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);

module.exports = router;
