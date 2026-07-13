const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const TYPES = ['routine', 'repair', 'inspection', 'other'];
const INTERVAL_TYPES = ['km', 'months'];

const createScheduleSchema = Joi.object({
  busId: objectId.required(),
  title: Joi.string().allow('').optional(),
  maintenanceType: Joi.string().valid(...TYPES).optional(),
  intervalType: Joi.string().valid(...INTERVAL_TYPES).required(),
  intervalValue: Joi.number().min(1).required(),
  lastServiceOdometer: Joi.number().min(0).optional(),
  lastServiceDate: Joi.date().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().allow('').optional(),
});

const updateScheduleSchema = Joi.object({
  busId: objectId.optional(),
  title: Joi.string().allow('').optional(),
  maintenanceType: Joi.string().valid(...TYPES).optional(),
  intervalType: Joi.string().valid(...INTERVAL_TYPES).optional(),
  intervalValue: Joi.number().min(1).optional(),
  lastServiceOdometer: Joi.number().min(0).optional(),
  lastServiceDate: Joi.date().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
  notes: Joi.string().allow('').optional(),
}).min(1);

module.exports = { createScheduleSchema, updateScheduleSchema };
