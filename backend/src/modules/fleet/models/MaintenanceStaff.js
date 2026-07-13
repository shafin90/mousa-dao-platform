const mongoose = require('mongoose');

const maintenanceStaffSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, default: '' },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceFacility' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

maintenanceStaffSchema.index({ companyId: 1, name: 1 });

module.exports = mongoose.model('MaintenanceStaff', maintenanceStaffSchema);
