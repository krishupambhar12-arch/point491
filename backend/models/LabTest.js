const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  test_name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("LabTest", labTestSchema);
