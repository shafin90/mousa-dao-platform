const Joi = require('joi');

const stopSchema = Joi.object({
  _id: Joi.string().optional(),
  cityId: Joi.string().required(),
  arrivalTime: Joi.string().allow('').optional(),
  departureTime: Joi.string().allow('').optional(),
  status: Joi.string().valid('confirmed', 'pending', 'cancelled').optional(),
});

const createRouteSchema = Joi.object({
  fromStation: Joi.string().required(),
  toStation: Joi.string().required(),
  baseFare: Joi.number().required(),
  distanceKm: Joi.number().required(),
  estimatedTimeMinutes: Joi.number().optional(),
  stops: Joi.array().items(stopSchema).optional(),
});

module.exports = { createRouteSchema };
