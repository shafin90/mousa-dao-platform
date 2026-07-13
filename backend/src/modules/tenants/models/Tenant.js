const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  domain: { type: String, sparse: true, trim: true },
  plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  settings: {
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'XOF' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    features: {
      enableBooking: { type: Boolean, default: true },
      enablePayments: { type: Boolean, default: true },
      enableTicketing: { type: Boolean, default: true },
      enableTracking: { type: Boolean, default: true },
    },
    commission: {
      platformPercentage: { type: Number, default: 10 },
      driverPercentage: { type: Number, default: 80 },
    },
    taxPercentage: { type: Number, default: 5 },
    pricingRules: {
      defaultBaseFareMultiplier: { type: Number, default: 1 },
      vipMultiplier: { type: Number, default: 1.5 },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
