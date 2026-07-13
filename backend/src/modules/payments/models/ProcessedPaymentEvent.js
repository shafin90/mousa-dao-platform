const mongoose = require('mongoose');

const processedPaymentEventSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  eventId: { type: String, required: true },
  tx_ref: { type: String, required: true },
  transactionId: { type: String, required: true },
  processedAt: { type: Date, default: Date.now }
});

processedPaymentEventSchema.index({ companyId: 1, eventId: 1 }, { unique: true });
processedPaymentEventSchema.index({ companyId: 1, tx_ref: 1 }, { unique: true });
processedPaymentEventSchema.index({ companyId: 1, transactionId: 1 }, { unique: true });

module.exports = mongoose.model('ProcessedPaymentEvent', processedPaymentEventSchema);
