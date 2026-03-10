const mongoose = require('mongoose');

const consultationMessageSchema = new mongoose.Schema({
  consultation_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Consultation', 
    required: true 
  },
  sender_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sender_role: {
    type: String,
    enum: ['Client', 'Attorney'],
    required: true
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("ConsultationMessage", consultationMessageSchema);
