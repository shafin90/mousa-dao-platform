const mongoose = require('mongoose');

const maintenanceFacilitySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  manager: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  services: { type: [String], default: [] },
  notes: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

maintenanceFacilitySchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('MaintenanceFacility', maintenanceFacilitySchema);
