const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true },
  relatedBusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
