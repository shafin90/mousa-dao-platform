const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'staff', 'driver', 'customer'),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phone: Joi.string().optional(),
}).min(1);

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'staff', 'driver', 'customer').required(),
});

const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

module.exports = { createUserSchema, updateProfileSchema, updateRoleSchema, updateStatusSchema };
