const Joi = require('joi');

const createBookingSchema = Joi.object({
  tripId: Joi.string().required(),
  seats: Joi.array().items(Joi.string()).min(1).required(),
});

const changeSeatSchema = Joi.object({
  oldSeat: Joi.string().required(),
  newSeat: Joi.string().required(),
});

module.exports = { createBookingSchema, changeSeatSchema };
