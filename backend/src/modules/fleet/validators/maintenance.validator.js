const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createMaintenanceSchema = Joi.object({
  busId: objectId.required(),
  facilityId: objectId.allow(null, ''),
  date: Joi.date().required(),
  type: Joi.string().valid('routine', 'repair', 'inspection', 'other').default('other'),
  description: Joi.string().required(),
  cost: Joi.number().min(0).optional(),
  odometer: Joi.number().min(0).optional(),
  performedBy: Joi.string().allow('').optional(),
  nextServiceDate: Joi.date().optional(),
});

const updateMaintenanceSchema = Joi.object({
  busId: objectId.optional(),
  facilityId: objectId.allow(null, ''),
  date: Joi.date().optional(),
  type: Joi.string().valid('routine', 'repair', 'inspection', 'other').optional(),
  description: Joi.string().optional(),
  cost: Joi.number().min(0).optional(),
  odometer: Joi.number().min(0).optional(),
  performedBy: Joi.string().allow('').optional(),
  nextServiceDate: Joi.date().allow(null).optional(),
}).min(1);

module.exports = { createMaintenanceSchema, updateMaintenanceSchema };
