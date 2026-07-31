const express = require('express');
const router = express.Router();
const paymentMethodController = require('./controllers/paymentMethod.controller');
const { authenticate } = require('../auth/auth.middleware');

router.use(authenticate);

router.get('/my', paymentMethodController.getMyPaymentMethods);
router.post('/', paymentMethodController.addPaymentMethod);
router.delete('/:id', paymentMethodController.deletePaymentMethod);
router.patch('/:id/default', paymentMethodController.setDefaultPaymentMethod);

module.exports = router;
