const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceFacility', index: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['routine', 'repair', 'inspection', 'other'], default: 'routine' },
  description: { type: String, required: true },
  cost: { type: Number, default: 0 },
  odometer: { type: Number },
  performedBy: { type: String },
  nextServiceDate: { type: Date },
}, { timestamps: true });

maintenanceSchema.index({ companyId: 1, busId: 1, date: -1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
