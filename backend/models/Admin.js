const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  permissions: [String],
  // Admin login tracking fields
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  loginHistory: [{
    loginTime: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String }
  }]
});

module.exports = mongoose.model("Admin", adminSchema);
