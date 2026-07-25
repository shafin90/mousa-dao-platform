const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  email2: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().required(),
  phone2: Joi.string().allow('', null).optional(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'manager', 'staff', 'driver', 'customer'),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  dateOfBirth: Joi.date().allow(null).optional(),
  employmentStatus: Joi.string().valid('active', 'inactive', 'on_leave', 'terminated').optional(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
}).min(1);

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'manager', 'staff', 'driver', 'customer').required(),
});

const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

module.exports = { createUserSchema, updateProfileSchema, updateRoleSchema, updateStatusSchema };
