const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  thresholdLevel: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
