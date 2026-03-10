const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  service_name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['Legal Service', 'Consultation', 'Document Review', 'Court Representation', 'Legal Advice'],
    default: 'Legal Service'
  },
  icon: {
    type: String,
    default: 'Gavel',
    required: true
  },
  icon_file: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletionReason: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
serviceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Index for better query performance
serviceSchema.index({ service_name: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ is_active: 1 });

module.exports = mongoose.model('Service', serviceSchema);
