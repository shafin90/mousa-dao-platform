const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  module: { type: String, required: true },
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['success', 'failed'], default: 'success' }
}, { timestamps: { createdAt: true, updatedAt: false } });

auditSchema.index({ companyId: 1, userId: 1, module: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model('Audit', auditSchema);
