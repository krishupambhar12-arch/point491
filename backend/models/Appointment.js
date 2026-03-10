const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attorney_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Attorney', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Attorney', required: true }, // For backward compatibility
  date: { type: Date, required: true },
  time: { type: String, required: true },
  // New consultation fields
  subject: { type: String, required: true },
  personalInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  purpose: { type: String, required: true },
  caseSummary: { type: String, required: true },
  documents: { type: String, default: "" },
  desiredOutcome: { type: String, required: true },
  attorneyName: { type: String, required: true },
  attorneySpecialization: { type: String, required: true },
  attorneyFees: { type: Number, required: true },
  // Legacy fields (for backward compatibility)
  symptoms: { type: String, default: "" },
  notes: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
