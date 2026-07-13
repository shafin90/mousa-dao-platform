const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createFacilitySchema = Joi.object({
  name: Joi.string().required(),
  cityId: objectId.allow(null, ''),
  address: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  manager: Joi.string().allow('').optional(),
  capacity: Joi.number().min(0).optional(),
  services: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().allow('').optional(),
  isActive: Joi.boolean().optional(),
});

const updateFacilitySchema = Joi.object({
  name: Joi.string().optional(),
  cityId: objectId.allow(null, ''),
  address: Joi.string().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  manager: Joi.string().allow('').optional(),
  capacity: Joi.number().min(0).optional(),
  services: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().allow('').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createFacilitySchema, updateFacilitySchema };
