const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createCitySchema = Joi.object({
  name: Joi.string().required(),
  country: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().optional().allow(null),
    lng: Joi.number().optional().allow(null),
  }).optional().allow(null),
  address1: Joi.string().optional().allow(''),
  address2: Joi.string().optional().allow(''),
  phone1: Joi.string().optional().allow(''),
  phone2: Joi.string().optional().allow(''),
  email1: Joi.string().optional().allow(''),
  email2: Joi.string().optional().allow(''),
  manager1: objectId.optional().allow(null, ''),
  manager2: objectId.optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
});

const updateCitySchema = Joi.object({
  name: Joi.string().required(),
  country: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().optional().allow(null),
    lng: Joi.number().optional().allow(null),
  }).optional().allow(null),
  address1: Joi.string().optional().allow(''),
  address2: Joi.string().optional().allow(''),
  phone1: Joi.string().optional().allow(''),
  phone2: Joi.string().optional().allow(''),
  email1: Joi.string().optional().allow(''),
  email2: Joi.string().optional().allow(''),
  manager1: objectId.optional().allow(null, ''),
  manager2: objectId.optional().allow(null, ''),
  isActive: Joi.boolean().optional(),
});

module.exports = { createCitySchema, updateCitySchema };
