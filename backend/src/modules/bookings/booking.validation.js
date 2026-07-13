const Joi = require('joi');

const createBookingSchema = Joi.object({
  tripId: Joi.string().required(),
  seats: Joi.array().items(Joi.string()).min(1).required()
});

const cancelBookingSchema = Joi.object({});

module.exports = { createBookingSchema, cancelBookingSchema };
