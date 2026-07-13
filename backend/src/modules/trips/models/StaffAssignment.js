const mongoose = require('mongoose');

const staffAssignmentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  role: { type: String, enum: ['checker', 'assistant'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('StaffAssignment', staffAssignmentSchema);
