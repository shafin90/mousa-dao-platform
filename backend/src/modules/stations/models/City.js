const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  country: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  address1: { type: String },
  address2: { type: String },
  phone1: { type: String },
  phone2: { type: String },
  email1: { type: String },
  email2: { type: String },
  manager1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  manager2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

citySchema.index({ companyId: 1, country: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
