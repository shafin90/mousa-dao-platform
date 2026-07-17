const Joi = require('joi');

const createRouteSchema = Joi.object({
  fromStation: Joi.string().required(),
  toStation: Joi.string().required(),
  distanceKm: Joi.number().required(),
  estimatedTimeMinutes: Joi.number().optional(),

});

module.exports = { createRouteSchema };
