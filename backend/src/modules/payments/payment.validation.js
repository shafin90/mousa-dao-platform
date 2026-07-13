const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string().required(),
  method: Joi.string().valid('wave', 'orange_money', 'mtn', 'moov', 'flutterwave').required()
});

const webhookSchema = Joi.object({
  event: Joi.string().required(),
  data: Joi.object({
    id: Joi.number().required(),
    tx_ref: Joi.string().required(),
    flw_ref: Joi.string().optional(),
    amount: Joi.number().required(),
    currency: Joi.string().required(),
    status: Joi.string().required(),
    customer: Joi.object().unknown(true).optional(),
  }).unknown(true).required()
}).unknown(true);

module.exports = { initiatePaymentSchema, webhookSchema };
