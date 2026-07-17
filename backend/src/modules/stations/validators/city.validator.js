const Joi = require('joi');

const createCitySchema = Joi.object({
  name: Joi.string().required(),
  country: Joi.string().required(),
});

const updateCitySchema = Joi.object({
  name: Joi.string().required(),
  country: Joi.string().required(),
});

module.exports = { createCitySchema, updateCitySchema };
