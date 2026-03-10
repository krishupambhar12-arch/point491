const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  subject: { 
    type: String, 
    required: true,
    trim: true
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5,
    default: 5
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Reviewed', 'Resolved', 'Archived'], 
    default: 'Pending' 
  },
  admin_response: {
    type: String,
    trim: true,
    default: ""
  },
  responded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  responded_at: {
    type: Date
  },
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);

