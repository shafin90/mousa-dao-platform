const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const STATUSES = ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'];
const TYPES = ['routine', 'repair', 'inspection', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const createWorkOrderSchema = Joi.object({
  busId: objectId.required(),
  maintenanceType: Joi.string().valid(...TYPES).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  assignedTechnician: objectId.allow(null, ''),
  facilityId: objectId.allow(null, ''),
  description: Joi.string().allow('').optional(),
  expectedCompletion: Joi.date().allow(null, '').optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  cost: Joi.number().min(0).optional(),
  odometer: Joi.number().min(0).optional(),
  notes: Joi.string().allow('').optional(),
});

const updateWorkOrderSchema = Joi.object({
  busId: objectId.optional(),
  maintenanceType: Joi.string().valid(...TYPES).optional(),
  priority: Joi.string().valid(...PRIORITIES).optional(),
  assignedTechnician: objectId.allow(null, ''),
  facilityId: objectId.allow(null, ''),
  description: Joi.string().allow('').optional(),
  expectedCompletion: Joi.date().allow(null, '').optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  cost: Joi.number().min(0).optional(),
  odometer: Joi.number().min(0).optional(),
  notes: Joi.string().allow('').optional(),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

module.exports = { createWorkOrderSchema, updateWorkOrderSchema, updateStatusSchema };
