const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createStaffSchema = Joi.object({
  name: Joi.string().required(),
  phone: Joi.string().allow('').optional(),
  role: Joi.string().allow('').optional(),
  facilityId: objectId.allow(null, ''),
  isActive: Joi.boolean().optional(),
});

const updateStaffSchema = Joi.object({
  name: Joi.string().optional(),
  phone: Joi.string().allow('').optional(),
  role: Joi.string().allow('').optional(),
  facilityId: objectId.allow(null, ''),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = { createStaffSchema, updateStaffSchema };
