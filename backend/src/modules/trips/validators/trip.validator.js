const Joi = require('joi');

const createTripSchema = Joi.object({
  routeId: Joi.string().optional(),
  fromStation: Joi.string().required(),
  toStation: Joi.string().required(),
  busId: Joi.string().required(),
  departureTime: Joi.string().required(),
  arrivalTime: Joi.string().required(),
  actualDepartureTime: Joi.string().optional().allow(''),
  actualArrivalTime: Joi.string().optional().allow(''),
  delayMinutes: Joi.number().optional(),
  date: Joi.date().required(),
  price: Joi.number().required(),
  status: Joi.string().valid('scheduled', 'active', 'completed', 'cancelled').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('scheduled', 'active', 'completed', 'cancelled').required(),
});

module.exports = { createTripSchema, updateStatusSchema };
