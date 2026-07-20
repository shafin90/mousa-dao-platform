const Joi = require('joi');

const stopSchema = Joi.object({
  _id: Joi.string().optional(),
  cityId: Joi.string().required(),
  name: Joi.string().allow('').optional(),
  status: Joi.string().valid('confirmed', 'pending', 'cancelled').optional(),
});

const createRouteSchema = Joi.object({
  fromCity: Joi.string().required(),
  toCity: Joi.string().required(),
  distanceKm: Joi.number().required(),
  estimatedTimeMinutes: Joi.number().optional(),
  stops: Joi.array().items(stopSchema).optional(),
});

module.exports = { createRouteSchema };
