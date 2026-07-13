const Joi = require('joi');

const updateConfigSchema = Joi.object({
  baseCurrency: Joi.string(),
  timezone: Joi.string(),
  platformCommissionPercentage: Joi.number().min(0).max(100),
  driverCommissionPercentage: Joi.number().min(0).max(100),
  taxPercentage: Joi.number().min(0).max(100),
  maintenanceMode: Joi.boolean(),
  featureFlags: Joi.object({
    enableBooking: Joi.boolean(),
    enablePayments: Joi.boolean(),
    enableTicketing: Joi.boolean()
  }),
  pricingRules: Joi.object({
    defaultBaseFareMultiplier: Joi.number().min(0),
    vipMultiplier: Joi.number().min(0)
  })
});

module.exports = { updateConfigSchema };
