const Payment = require('../../src/modules/payments/models/Payment');

const createTestPayment = async (bookingId, userId, amount, tx_ref, status = 'pending') => {
  return await Payment.create({
    bookingId,
    userId,
    method: 'flutterwave',
    tx_ref,
    status
  });
};

module.exports = { createTestPayment };
