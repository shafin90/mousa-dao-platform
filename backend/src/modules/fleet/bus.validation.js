const Joi = require('joi');

const createBusSchema = Joi.object({
  busNumber: Joi.string().required(),
  name: Joi.string().required(),
  type: Joi.string().valid('VIP', 'Premium', 'Mini', 'Standard').required(),
  capacity: Joi.number().integer().min(1).required(),
  features: Joi.object().optional(),
  assignedDriver: Joi.string().optional(),
  busManager: Joi.string().optional(),
  maintenanceManager: Joi.string().optional(),
  registrationNumber: Joi.string().optional(),
  insuranceIssueDate: Joi.date().optional(),
  lastInspectionDate: Joi.date().optional(),
  firstServiceDate: Joi.date().optional(),
  matriculationDate: Joi.date().optional()
});

const updateBusStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'maintenance', 'inactive').required()
});

const assignDriverSchema = Joi.object({
  driverId: Joi.string().required()
});

const maintenanceLogSchema = Joi.object({
  description: Joi.string().required(),
  date: Joi.date().required(),
  cost: Joi.number().required()
});

module.exports = { createBusSchema, updateBusStatusSchema, assignDriverSchema, maintenanceLogSchema };
