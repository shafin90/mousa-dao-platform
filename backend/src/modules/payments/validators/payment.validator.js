const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string().required(),
  method: Joi.string().valid('wave', 'orange_money', 'mtn', 'moov', 'flutterwave').required(),
});

module.exports = { initiatePaymentSchema };
