const mongoose = require('mongoose');

const busLocationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

busLocationSchema.index({ companyId: 1, busId: 1 }, { unique: true });
busLocationSchema.index({ companyId: 1, tripId: 1 });

module.exports = mongoose.model('BusLocation', busLocationSchema);
