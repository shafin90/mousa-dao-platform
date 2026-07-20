const Joi = require('joi');

const createTripSchema = Joi.object({
  routeId: Joi.string().optional(),
  busId: Joi.string().required(),
  departureTime: Joi.string().required(),
  arrivalTime: Joi.string().required(),
  date: Joi.date().required(),
  price: Joi.number().required(),
  status: Joi.string().valid('scheduled', 'active', 'completed', 'cancelled').optional()
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'active', 'completed', 'cancelled').required()
});

module.exports = { createTripSchema, updateStatusSchema };
