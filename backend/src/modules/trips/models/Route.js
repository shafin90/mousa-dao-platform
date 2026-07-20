const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  name: { type: String, default: '' },
  status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' }
}, { _id: true });

const routeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fromCity: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  toCity: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  fromStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
  toStations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],

  distanceKm: { type: Number, required: true },
  estimatedTimeMinutes: { type: Number },
  baseRate: { type: Number },
  isActive: { type: Boolean, default: true },
  stops: { type: [stopSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

routeSchema.index({ companyId: 1, fromCity: 1, toCity: 1 }, { unique: true });

module.exports = mongoose.model('Route', routeSchema);
