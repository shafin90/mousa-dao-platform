const Joi = require('joi');

const createBookingSchema = Joi.object({
  tripId: Joi.string().required(),
  seats: Joi.array().items(Joi.string()).min(1).required(),
});

module.exports = { createBookingSchema };
