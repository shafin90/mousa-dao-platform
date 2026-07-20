const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  address: { type: String, default: '' },
  address1: { type: String, default: '' },
  address2: { type: String, default: '' },
  phone1: { type: String, default: '' },
  phone2: { type: String, default: '' },
  email1: { type: String, default: '' },
  email2: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  manager1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  manager2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

stationSchema.index({ companyId: 1, name: 1, cityId: 1 }, { unique: true });

module.exports = mongoose.model('Station', stationSchema);
