const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  arrivalTime: { type: String, default: '' },
  departureTime: { type: String, default: '' },
  status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' }
}, { _id: true });

const routeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  fromStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  toStation: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  baseFare: { type: Number, required: true },
  distanceKm: { type: Number, required: true },
  estimatedTimeMinutes: { type: Number },
  stops: { type: [stopSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
