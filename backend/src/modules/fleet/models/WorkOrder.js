const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  workOrderNumber: { type: String },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true, index: true },
  maintenanceType: { type: String, enum: ['routine', 'repair', 'inspection', 'other'], default: 'routine' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceStaff', default: null },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceFacility', default: null },
  description: { type: String, default: '' },
  expectedCompletion: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'], default: 'pending' },
  cost: { type: Number, default: 0 },
  odometer: { type: Number },
  completedAt: { type: Date },
  notes: { type: String, default: '' },
}, { timestamps: true });

workOrderSchema.index({ companyId: 1, workOrderNumber: 1 }, { unique: true });
workOrderSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
