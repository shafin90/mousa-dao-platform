const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true, index: true },
  baseCurrency: { type: String, default: 'XOF' },
  timezone: { type: String, default: 'UTC' },
  platformCommissionPercentage: { type: Number, default: 10 },
  driverCommissionPercentage: { type: Number, default: 80 },
  taxPercentage: { type: Number, default: 5 },
  maintenanceMode: { type: Boolean, default: false },
  featureFlags: {
    enableBooking: { type: Boolean, default: true },
    enablePayments: { type: Boolean, default: true },
    enableTicketing: { type: Boolean, default: true }
  },
  pricingRules: {
    defaultBaseFareMultiplier: { type: Number, default: 1 },
    vipMultiplier: { type: Number, default: 1.5 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);
