const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  client_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  attorney_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Attorney', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Closed', 'Completed'], 
    default: 'Active' 
  },
  subject: {
    type: String,
    default: ""
  },
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Consultation", consultationSchema);
