const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  address: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
}, { timestamps: true });

stationSchema.index({ companyId: 1, name: 1, cityId: 1 }, { unique: true });

module.exports = mongoose.model('Station', stationSchema);
