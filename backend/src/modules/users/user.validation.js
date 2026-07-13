const Joi = require('joi');

const updateProfileSchema = Joi.object({
  name: Joi.string(),
  phone: Joi.string(),
  address: Joi.string(),
  avatar: Joi.string(),
  gender: Joi.string().valid('male', 'female', 'other'),
  dateOfBirth: Joi.date()
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'staff', 'driver', 'customer').required()
});

const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

const createUserSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'staff', 'driver').required(),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  password: Joi.string().min(6),
  role: Joi.string().valid('admin', 'staff', 'driver'),
});

module.exports = { createUserSchema, updateUserSchema, updateProfileSchema, updateRoleSchema, updateStatusSchema };
