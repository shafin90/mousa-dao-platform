const mongoose = require('mongoose');

const processedEventSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  eventId: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

processedEventSchema.index({ companyId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('ProcessedEvent', processedEventSchema);
