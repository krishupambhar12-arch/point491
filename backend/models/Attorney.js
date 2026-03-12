const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const attorneySchema = new mongoose.Schema({
  // Authentication fields
  attorneyName: {
    type: String,
    required: true
  },
  attorneyEmail: {
    type: String,
    required: true,
    unique: true
  },
  attorneyPassword: {
    type: String,
    required: true
  },
  attorneyPhone: {
    type: String,
    default: ""
  },
  attorneyGender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: ""
  },
  attorneyAddress: {
    type: String,
    default: ""
  },
  attorneyDOB: {
    type: Date,
    default: null
  },
  
  // Professional details
  specialization: {
    type: String,
    default: ""
  },
  qualification: {
    type: String,
    default: ""
  },
  experience: {
    type: Number,
    default: 0
  },
  fees: {
    type: Number,
    default: 0
  },
  
  // Additional Professional Information
  barNumber: {
    type: String,
    default: ""
  },
  licenseNumber: {
    type: String,
    default: ""
  },
  education: {
    type: String,
    default: ""
  },
  university: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  
  // Contact Information
  officeAddress: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    default: ""
  },
  state: {
    type: String,
    default: ""
  },
  zipCode: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  linkedin: {
    type: String,
    default: ""
  },
  
  // Practice Information
  languages: {
    type: String,
    default: ""
  },
  practiceAreas: {
    type: String,
    default: ""
  },
  availableDays: {
    type: String,
    default: ""
  },
  availableTimeStart: {
    type: String,
    default: "09:00"
  },
  availableTimeEnd: {
    type: String,
    default: "17:00"
  },
  
  profilePicture: {
    type: String,
    default: null
  },
  
  // Admin fields
  attorneyCode: {
    type: String,
    required: false,  // Changed to false - will be auto-generated
    unique: true
  },
  joiningDate: {
    type: String,
    default: null
  },
  
  // Soft delete fields
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  deletionReason: { type: String, default: null }
}, { timestamps: true });

// Pre-save hook to hash password
attorneySchema.pre("save", async function (next) {
  if (!this.isModified("attorneyPassword")) return next();
  console.log("🔍 Hashing attorney password for:", this.attorneyEmail);
  console.log("🔍 Original password length:", this.attorneyPassword.length);
  const salt = await bcrypt.genSalt(10);
  this.attorneyPassword = await bcrypt.hash(this.attorneyPassword, salt);
  console.log("🔍 Hashed password length:", this.attorneyPassword.length);
  next();
});

// Pre-save hook to generate attorneyCode if not provided
attorneySchema.pre("save", function (next) {
  if (this.isNew && !this.attorneyCode) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.attorneyCode = `ATT${timestamp}${random}`.toUpperCase();
    console.log("🔍 Generated attorneyCode:", this.attorneyCode);
  }
  next();
});

// Password comparison method
attorneySchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log("🔍 Comparing password for attorney:", this.attorneyEmail);
    console.log("🔍 Candidate password length:", candidatePassword.length);
    console.log("🔍 Stored password length:", this.attorneyPassword.length);
    
    const isMatch = await bcrypt.compare(candidatePassword, this.attorneyPassword);
    console.log("🔍 Password comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("❌ Password comparison error:", error);
    throw error;
  }
};

const Attorney = mongoose.model("Attorney", attorneySchema);
module.exports = Attorney;

