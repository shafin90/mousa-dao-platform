const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  country: { type: String, required: true }
}, { timestamps: true });

citySchema.index({ companyId: 1, country: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
