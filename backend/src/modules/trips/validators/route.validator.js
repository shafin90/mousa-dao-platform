const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const stopSchema = Joi.object({
  _id: Joi.string().optional(),
  cityId: Joi.string().required(),
  stationId: objectId.allow(null, '').optional(),
  name: Joi.string().allow('').optional(),
  status: Joi.string().valid('confirmed', 'pending', 'cancelled').optional(),
});

const createRouteSchema = Joi.object({
  fromCity: Joi.string().required(),
  toCity: Joi.string().required(),
  fromStations: Joi.array().items(objectId).optional(),
  toStations: Joi.array().items(objectId).optional(),

  distanceKm: Joi.number().required(),
  estimatedTimeMinutes: Joi.number().optional(),
  baseRate: Joi.number().optional().allow(null),
  isActive: Joi.boolean().optional(),
  stops: Joi.array().items(stopSchema).optional(),
});

module.exports = { createRouteSchema };
