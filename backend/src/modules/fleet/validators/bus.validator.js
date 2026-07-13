const Joi = require('joi');

const createBusSchema = Joi.object({
  busNumber: Joi.string().required(),
  name: Joi.string().required(),
  capacity: Joi.number().required(),
  type: Joi.string().valid('VIP', 'Premium', 'Mini', 'Standard').required(),
  features: Joi.object().optional(),
  assignedDriver: Joi.string().allow(null, '').optional(),
  status: Joi.string().valid('active', 'maintenance', 'inactive').optional(),

  // Managers
  busManager: Joi.string().allow(null, '').optional(),
  maintenanceManager: Joi.string().allow(null, '').optional(),

  // Vehicle identity
  make: Joi.string().allow('').optional(),
  model: Joi.string().allow('').optional(),
  year: Joi.number().allow(null).optional(),
  color: Joi.string().allow('').optional(),
  plateNumber: Joi.string().allow('').optional(),
  vin: Joi.string().allow('').optional(),
  fuelType: Joi.string().valid('diesel', 'petrol', 'electric', 'hybrid', 'cng').allow(null, '').optional(),
  odometer: Joi.number().allow(null).optional(),

  // Registration
  registrationNumber: Joi.string().allow('').optional(),

  // Compliance & documents
  registrationExpiry: Joi.date().allow(null, '').optional(),
  insuranceProvider: Joi.string().allow('').optional(),
  insurancePolicyNumber: Joi.string().allow('').optional(),
  insuranceIssueDate: Joi.date().allow(null, '').optional(),
  insuranceExpiry: Joi.date().allow(null, '').optional(),
  fitnessExpiry: Joi.date().allow(null, '').optional(),
  lastInspectionDate: Joi.date().allow(null, '').optional(),

  // Service
  firstServiceDate: Joi.date().allow(null, '').optional(),
  matriculationDate: Joi.date().allow(null, '').optional(),

  // Purchase & acquisition
  purchaseDate: Joi.date().allow(null, '').optional(),
  purchaseCost: Joi.number().allow(null).optional(),
  homeDepot: Joi.string().allow('').optional(),

  // Media
  photos: Joi.array().items(Joi.string().allow('')).optional(),
});

const updateBusStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'maintenance', 'inactive').required(),
});

const assignDriverSchema = Joi.object({
  driverId: Joi.string().required(),
});

const maintenanceLogSchema = Joi.object({
  date: Joi.date().required(),
  type: Joi.string().valid('routine', 'repair', 'inspection', 'other').optional(),
  description: Joi.string().required(),
  cost: Joi.number().min(0).optional(),
  odometer: Joi.number().allow(null).optional(),
  performedBy: Joi.string().allow('').optional(),
  nextServiceDate: Joi.date().allow(null, '').optional(),
  facilityId: Joi.string().hex().length(24).allow(null, '').optional(),
});

module.exports = { createBusSchema, updateBusStatusSchema, assignDriverSchema, maintenanceLogSchema };
