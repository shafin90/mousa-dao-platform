const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
  title: { type: String, default: '' },
  maintenanceType: { type: String, enum: ['routine', 'repair', 'inspection', 'other'], default: 'routine' },
  intervalType: { type: String, enum: ['km', 'months'], required: true },
  intervalValue: { type: Number, required: true },
  lastServiceOdometer: { type: Number, default: 0 },
  lastServiceDate: { type: Date },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

maintenanceScheduleSchema.index({ companyId: 1, busId: 1 });

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
