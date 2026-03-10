const mongoose = require('mongoose');

const labTestBookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  notes: { type: String, default: "" },
  status: { type: String, default: "Pending" }, // Pending, Confirmed, Completed, Cancelled
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("LabTestBooking", labTestBookingSchema);
