const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Attorney = require("../models/Attorney");
const Appointment = require("../models/Appointment");
const Admin = require("../models/Admin");
const Feedback = require("../models/Feedback");
const LabTest = require("../models/LabTest");
const LabTestBooking = require("../models/LabTestBooking");
const Consultation = require("../models/Consultation");
const ConsultationMessage = require("../models/ConsultationMessage");
const Service = require("../models/Service");
const Code = require("../models/Code");
const multer = require("multer");
const path = require("path");
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// ===== TEST ROUTE =====
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working!" });
});

// ===== ADMIN LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔍 Admin login attempt:", { email });

    // Check for default admin
    const defaultAdminEmail = "krishnapambhar@justice.com";
    const defaultAdminPassword = "krishna123";
    
    if (email === defaultAdminEmail && password === defaultAdminPassword) {
      console.log("✅ Default admin credentials match");
      
      // Check if user exists
      let user = await User.findOne({ email: defaultAdminEmail });
      
      if (!user) {
        // Create admin user
        user = new User({
          name: "Krishna Pambhar",
          email: defaultAdminEmail,
          password: defaultAdminPassword,
          role: "Admin"
        });
        await user.save();
        console.log("✅ Created admin user");
      }
      
      // Generate token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "secretKey",
        { expiresIn: "24h" }
      );

      return res.json({
        message: "Admin login successful",
        token,
        admin: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // For other admins
    const user = await User.findOne({ email });
    
    if (!user || user.role !== "Admin") {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "24h" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== ADMIN DASHBOARD =====
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access dashboard" });
    }

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalAttorneys = await Attorney.countDocuments({ isActive: true });
    const totalAppointments = await Appointment.countDocuments({ isActive: true });
    const pendingAppointments = await Appointment.countDocuments({ isActive: true, status: "Pending" });
    const confirmedAppointments = await Appointment.countDocuments({ isActive: true, status: "Confirmed" });
    const completedAppointments = await Appointment.countDocuments({ isActive: true, status: "Completed" });
    const expiredAppointments = await Appointment.countDocuments({ isActive: true, status: "Expired" });
    const totalFeedback = await Feedback.countDocuments({ isActive: true });

    res.json({
      totalUsers,
      totalAttorneys,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      expiredAppointments,
      totalFeedback
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET ALL USERS =====
router.get("/users", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access users" });
    }

    const users = await User.find({ isActive: true })
      .select('name email role isSocialLogin profilePicture provider providerId createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSocialLogin: user.isSocialLogin,
      profilePicture: user.profilePicture,
      provider: user.provider,
      providerId: user.providerId,
      signupDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      signupTime: user.createdAt ? new Date(user.createdAt).toLocaleTimeString() : 'N/A',
      lastLoginDate: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A',
      lastLoginTime: user.updatedAt ? new Date(user.updatedAt).toLocaleTimeString() : 'N/A'
    }));

    res.json({
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE USER (SOFT DELETE) =====
router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can delete users" });
    }

    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mark user as inactive instead of deleting
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletionReason = "Admin soft delete";
    await user.save();

    console.log("🔒 User marked as inactive (not deleted):", user.email);

    res.json({ 
      message: "User marked as inactive. Data preserved in database.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: "inactive",
        deletedAt: user.deletedAt
      }
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CODES API ROUTES =====

// CHECK ATTORNEY CODES (ACTIVE ONLY)
router.post("/codes/check", async (req, res) => {
  try {
    const { attorneyCode } = req.body;

    // Find attorney by attorney code in codes table (only active ones)
    const attorney = await Code.findOne({
      attorneyCode: attorneyCode,
      isActive: true
    });

    if (attorney) {
      res.json({ exists: true, message: "Attorney code found in codes table" });
    } else {
      res.json({ exists: false, message: "Attorney code not found in codes table" });
    }
  } catch (error) {
    console.error("Check codes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL CODES (ACTIVE ONLY)
router.get("/codes", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access codes" });
    }

    const codes = await Code.find({ isActive: true }).sort({ createdAt: -1 });
    
    const formattedCodes = codes.map(code => ({
      id: code._id,
      name: code.name,
      email: code.email,
      phone: code.phone,
      gender: code.gender,
      qualification: code.qualification,
      joiningDate: code.joiningDate,
      attorneyCode: code.attorneyCode,
      createdAt: code.createdAt,
      updatedAt: code.updatedAt
    }));

    res.json({ codes: formattedCodes });
  } catch (error) {
    console.error("Get codes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET DELETED/INACTIVE CODES (FOR ADMIN REFERENCE)
router.get("/codes/deleted", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access deleted codes" });
    }

    const codes = await Code.find({ isActive: false }).sort({ deletedAt: -1 });
    
    const formattedCodes = codes.map(code => ({
      id: code._id,
      name: code.name,
      email: code.email,
      phone: code.phone,
      gender: code.gender,
      qualification: code.qualification,
      joiningDate: code.joiningDate,
      attorneyCode: code.attorneyCode,
      deletedAt: code.deletedAt,
      deletionReason: code.deletionReason,
      createdAt: code.createdAt,
      updatedAt: code.updatedAt
    }));

    res.json({ deletedCodes: formattedCodes });
  } catch (error) {
    console.error("Get deleted codes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE NEW CODE
router.post("/codes", auth, async (req, res) => {
  try {
    console.log("🔍 Admin Codes Debug - User role:", req.userRole);
    console.log("🔍 Admin Codes Debug - Request body:", req.body);
    
    if (req.userRole !== "Admin") {
      console.log("❌ Access denied - User role:", req.userRole);
      return res.status(403).json({ message: "Only admins can create codes" });
    }

    const { name, email, phone, gender, qualification, joiningDate, attorneyCode } = req.body;

    // Check if attorney code already exists
    const existingCode = await Code.findOne({ attorneyCode });
    if (existingCode) {
      return res.status(400).json({ message: "Attorney code already exists" });
    }

    // Create new code
    const newCode = new Code({
      name,
      email,
      phone,
      gender,
      qualification,
      joiningDate,
      attorneyCode
    });

    await newCode.save();

    res.status(201).json({
      message: "Attorney created successfully",
      code: {
        id: newCode._id,
        name: newCode.name,
        email: newCode.email,
        phone: newCode.phone,
        gender: newCode.gender,
        qualification: newCode.qualification,
        joiningDate: newCode.joiningDate,
        attorneyCode: newCode.attorneyCode
      }
    });
  } catch (error) {
    console.error("Create code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE CODE
router.put("/codes/:id", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can update codes" });
    }

    const { name, email, phone, gender, qualification, joiningDate, attorneyCode } = req.body;
    const codeId = req.params.id;

    const code = await Code.findById(codeId);
    if (!code) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Check if attorney code is being changed and if it already exists
    if (attorneyCode !== code.attorneyCode) {
      const existingCode = await Code.findOne({ attorneyCode });
      if (existingCode) {
        return res.status(400).json({ message: "Attorney code already exists" });
      }
    }

    // Update code
    code.name = name;
    code.email = email;
    code.phone = phone;
    code.gender = gender;
    code.qualification = qualification;
    code.joiningDate = joiningDate;
    code.attorneyCode = attorneyCode;

    await code.save();

    res.json({
      message: "Attorney updated successfully",
      code: {
        id: code._id,
        name: code.name,
        email: code.email,
        phone: code.phone,
        gender: code.gender,
        qualification: code.qualification,
        joiningDate: code.joiningDate,
        attorneyCode: code.attorneyCode
      }
    });
  } catch (error) {
    console.error("Update code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET All Attorneys (Admin) - Show only active attorneys
router.get("/doctors", auth, async (req, res) => {
  try {
    console.log("🔍 Admin fetching all attorneys");
    
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access attorneys" });
    }

    // Get only active attorneys (isActive: true)
    const attorneys = await Attorney.find({ isActive: true })
      .select('attorneyName attorneyEmail attorneyPhone attorneyGender specialization qualification experience fees profilePicture created_at attorneyCode joiningDate')
      .sort({ created_at: -1 })
      .lean();

    // Transform _id to id for frontend consistency
    const transformedAttorneys = attorneys.map(attorney => ({
      id: attorney._id,
      name: attorney.attorneyName,
      email: attorney.attorneyEmail,
      phone: attorney.attorneyPhone,
      gender: attorney.attorneyGender,
      specialization: attorney.specialization,
      qualification: attorney.qualification,
      experience: attorney.experience,
      fees: attorney.fees,
      profilePicture: attorney.profilePicture,
      attorneyCode: attorney.attorneyCode,
      joiningDate: attorney.joiningDate,
      created_at: attorney.created_at
    }));

    console.log(`🔍 Found ${transformedAttorneys.length} active attorneys`);
    res.json({ doctors: transformedAttorneys });
  } catch (error) {
    console.error("Get admin attorneys error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE ATTORNEY (Admin) - Database Verification
router.post("/doctors", auth, async (req, res) => {
  try {
    console.log("🔍 POST /doctors route hit!");
    console.log("🔍 Request body:", req.body);
    
    // Check database connection
    console.log("🔍 Checking database connection...");
    const mongoose = require("mongoose");
    console.log("🔍 Mongoose connection state:", mongoose.connection.readyState);
    console.log("🔍 Mongoose connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting");
    
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected!");
      return res.status(500).json({ 
        message: "Database not connected", 
        connectionState: mongoose.connection.readyState 
      });
    }
    
    console.log("✅ Database connected successfully");
    
    if (req.userRole !== "Admin") {
      console.log("❌ Access denied - User role:", req.userRole);
      return res.status(403).json({ message: "Only admins can create attorneys" });
    }

    const { name, email, phone, gender, qualification, joiningDate, attorneyCode } = req.body;
    console.log("🔍 Extracted data:", { name, email, phone, gender, qualification, joiningDate, attorneyCode });

    // Basic validation
    if (!name || !email) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if Attorney model is working
    console.log("🔍 Testing Attorney model...");
    try {
      const testCount = await Attorney.countDocuments();
      console.log("🔍 Attorney model working, current count:", testCount);
    } catch (dbError) {
      console.error("❌ Attorney model error:", dbError);
      return res.status(500).json({ message: "Database model error", error: dbError.message });
    }

    // Check for existing attorney
    console.log("🔍 Checking existing attorney with email:", email);
    let existingAttorney;
    try {
      existingAttorney = await Attorney.findOne({ attorneyEmail: email });
    } catch (findError) {
      console.error("❌ Find attorney error:", findError);
      return res.status(500).json({ message: "Database query error", error: findError.message });
    }
    
    if (existingAttorney) {
      console.log("❌ Attorney already exists with email:", email);
      return res.status(400).json({ message: "Attorney with this email already exists" });
    }

    // Create attorney object
    console.log("🔍 Creating attorney object...");
    
    // Generate attorney code
    const generateAttorneyCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    const attorneyData = {
      attorneyName: name,
      attorneyEmail: email,
      attorneyPassword: "tempPassword123", // Temporary password for admin-created attorneys
      attorneyPhone: phone || "",
      attorneyGender: gender || "Male", // Make sure it matches the enum
      qualification: qualification || "",
      attorneyCode: attorneyCode || generateAttorneyCode(), // Use frontend code or generate one
      joiningDate: joiningDate || new Date().toISOString().split('T')[0], // Use frontend date or current date
      isActive: true
    };
    
    console.log("🔍 Attorney data:", attorneyData);

    // Save to database
    let newAttorney;
    try {
      console.log("🔍 Creating Attorney instance...");
      newAttorney = new Attorney(attorneyData);
      console.log("🔍 Attorney instance created:", newAttorney);
      console.log("🔍 Attorney instance _id:", newAttorney._id);
      
      console.log("🔍 Attempting to save to database...");
      const savedAttorney = await newAttorney.save();
      console.log("✅ Attorney saved to database!");
      console.log("✅ Saved attorney _id:", savedAttorney._id);
      console.log("✅ Saved attorney data:", savedAttorney);
      
      // Verify save by immediately fetching
      console.log("🔍 Verifying save by fetching from database...");
      const verification = await Attorney.findById(savedAttorney._id);
      if (verification) {
        console.log("✅ Save verification successful - attorney found in database");
        console.log("✅ Verified attorney:", verification.attorneyName);
      } else {
        console.log("❌ Save verification failed - attorney not found in database");
      }
      
      newAttorney = savedAttorney;
      
    } catch (saveError) {
      console.error("❌ Save attorney error:", saveError);
      console.error("❌ Error name:", saveError.name);
      console.error("❌ Error message:", saveError.message);
      console.error("❌ Error details:", saveError);
      return res.status(500).json({ 
        message: "Database save error", 
        error: saveError.message,
        errorName: saveError.name
      });
    }

    console.log("✅ Attorney created successfully:", newAttorney.attorneyName);

    res.status(201).json({
      message: "Attorney created successfully",
      attorney: {
        id: newAttorney._id,
        name: newAttorney.attorneyName,
        email: newAttorney.attorneyEmail,
        phone: newAttorney.attorneyPhone,
        gender: newAttorney.attorneyGender,
        qualification: newAttorney.qualification,
        attorneyCode: newAttorney.attorneyCode,
        joiningDate: newAttorney.joiningDate,
        isActive: newAttorney.isActive
      }
    });
    
  } catch (error) {
    console.error("❌ General error:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error message:", error.message);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      stack: error.stack
    });
  }
});

// SIMPLE TEST ROUTE - No Auth Required
router.post("/test-doctors", async (req, res) => {
  try {
    console.log("🔍 Simple test route hit!");
    console.log("🔍 Request body:", req.body);
    
    res.status(200).json({
      message: "Simple test working!",
      received: req.body
    });
    
  } catch (error) {
    console.error("❌ Simple test error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE ATTORNEY (HARD DELETE)
router.delete("/doctors/:id", async (req, res) => {
  try {
    console.log("🔍 Delete Attorney Debug - Attorney ID:", req.params.id);
    
    const attorneyId = req.params.id;
    const attorney = await Attorney.findById(attorneyId);
    
    if (!attorney) {
      console.log("❌ Attorney not found - ID:", attorneyId);
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Soft delete - mark as inactive but keep data in database
    attorney.isActive = false;
    attorney.deletedAt = new Date();
    attorney.deletionReason = "Admin deletion";
    await attorney.save();

    console.log("✅ Attorney soft deleted (data preserved):", attorney.attorneyName);

    res.json({ 
      message: "Attorney deleted successfully",
      attorney: {
        id: attorney._id,
        name: attorney.attorneyName,
        email: attorney.attorneyEmail,
        status: "inactive",
        deletedAt: attorney.deletedAt
      },
      deleted: true
    });
  } catch (error) {
    console.error("Delete attorney error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE CODE (SOFT DELETE) - Also deactivate corresponding attorney
router.delete("/codes/:id", auth, async (req, res) => {
  try {
    console.log("🔍 Delete Code Debug - User role:", req.userRole);
    console.log("🔍 Delete Code Debug - Code ID:", req.params.id);
    
    if (req.userRole !== "Admin") {
      console.log("❌ Access denied - User role:", req.userRole);
      return res.status(403).json({ message: "Only admins can delete codes" });
    }

    const codeId = req.params.id;
    const code = await Code.findById(codeId);
    
    if (!code) {
      console.log("❌ Attorney not found - ID:", codeId);
      return res.status(404).json({ message: "Attorney not found" });
    }

    console.log("🔍 Found attorney to delete:", code.email);

    // Soft delete - mark as inactive instead of deleting
    code.isActive = false;
    code.deletedAt = new Date();
    code.deletionReason = "Admin soft delete";
    await code.save();

    console.log("✅ Attorney marked as inactive in codes collection:", code.name);

    // Also deactivate the corresponding attorney in the Attorney model
    try {
      const attorney = await Attorney.findOne({ attorneyEmail: code.email });
      if (attorney) {
        console.log("🔍 Found corresponding attorney in Attorney model:", attorney.attorneyEmail);
        attorney.isActive = false;
        attorney.deletedAt = new Date();
        attorney.deletionReason = "Admin deletion via codes";
        await attorney.save();
        console.log("✅ Corresponding attorney also deactivated:", attorney.attorneyName);
      } else {
        console.log("⚠️ No corresponding attorney found in Attorney model for email:", code.email);
      }
    } catch (attorneyError) {
      console.error("❌ Error deactivating attorney in Attorney model:", attorneyError);
      // Continue with response even if attorney deactivation fails
    }

    res.json({ 
      message: "Attorney deleted successfully (login access revoked)",
      attorney: {
        id: code._id,
        name: code.name,
        email: code.email,
        status: "inactive",
        deletedAt: code.deletedAt
      }
    });
  } catch (error) {
    console.error("Delete code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// RESTORE DELETED CODE - Also restore corresponding attorney
router.put("/codes/:id/restore", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can restore codes" });
    }

    const codeId = req.params.id;
    const code = await Code.findById(codeId);
    
    if (!code) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    if (code.isActive) {
      return res.status(400).json({ message: "Attorney is already active" });
    }

    // Restore the code
    code.isActive = true;
    code.deletedAt = null;
    code.deletionReason = null;
    await code.save();

    console.log("✅ Attorney restored successfully in codes collection:", code.name);

    // Also restore the corresponding attorney in the Attorney model
    try {
      const attorney = await Attorney.findOne({ attorneyEmail: code.email });
      if (attorney) {
        attorney.isActive = true;
        attorney.deletedAt = null;
        attorney.deletionReason = null;
        await attorney.save();
        console.log("✅ Corresponding attorney also restored:", attorney.attorneyName);
      } else {
        console.log("⚠️ No corresponding attorney found in Attorney model for email:", code.email);
      }
    } catch (attorneyError) {
      console.error("❌ Error restoring attorney in Attorney model:", attorneyError);
      // Continue with response even if attorney restoration fails
    }

    res.json({
      message: "Attorney restored successfully (login access granted)",
      attorney: {
        id: code._id,
        name: code.name,
        email: code.email,
        status: "active"
      }
    });
  } catch (error) {
    console.error("Restore code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// QUICK FIX: Force deactivate om@gmail.com
router.post("/force-deactivate-om", auth, async (req, res) => {
  try {
    console.log("🔍 Force deactivating om@gmail.com...");
    
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can do this" });
    }

    let deactivatedInAttorney = false;
    let deactivatedInCode = false;

    // Force deactivate in Attorney model
    const attorney = await Attorney.findOne({ attorneyEmail: "om@gmail.com" });
    if (attorney) {
      attorney.isActive = false;
      attorney.deletedAt = new Date();
      attorney.deletionReason = "Force admin deactivation";
      await attorney.save();
      deactivatedInAttorney = true;
      console.log("✅ Force deactivated in Attorney model");
    }

    // Force deactivate in Code collection
    const code = await Code.findOne({ email: "om@gmail.com" });
    if (code) {
      code.isActive = false;
      code.deletedAt = new Date();
      code.deletionReason = "Force admin deactivation";
      await code.save();
      deactivatedInCode = true;
      console.log("✅ Force deactivated in Code collection");
    }

    res.json({
      message: "Force deactivation completed",
      results: {
        deactivatedInAttorney,
        deactivatedInCode,
        attorneyFound: !!attorney,
        codeFound: !!code
      }
    });

  } catch (error) {
    console.error("❌ Force deactivate error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== ADMIN SERVICES ROUTES =====

// Multer setup for service icon uploads
const serviceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/service-icons/"); // Create uploads/service-icons directory
  },
  filename: function (req, file, cb) {
    cb(null, "service-icon-" + Date.now() + "-" + Math.random().toString(36).substring(7) + path.extname(file.originalname));
  }
});

const serviceUpload = multer({ 
  storage: serviceStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// GET All Services (Admin)
router.get("/services", auth, async (req, res) => {
  try {
    console.log("🔍 Admin fetching all services");
    
    const services = await Service.find({ is_active: true })
      .select('service_name description price category icon icon_file is_active created_at updated_at')
      .sort({ created_at: -1 })
      .lean();

    // Transform _id to id for frontend consistency
    const transformedServices = services.map(service => ({
      id: service._id,
      service_name: service.service_name,
      description: service.description,
      price: service.price,
      category: service.category,
      icon: service.icon,
      icon_file: service.icon_file,
      is_active: service.is_active,
      created_at: service.created_at,
      updated_at: service.updated_at
    }));

    console.log(`🔍 Found ${transformedServices.length} active services`);
    res.json({ services: transformedServices });
  } catch (error) {
    console.error("Get admin services error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE Service (Admin)
router.post("/services", auth, serviceUpload.single("iconFile"), async (req, res) => {
  try {
    console.log("🔍 Admin creating service");
    console.log("🔍 Request body:", req.body);
    console.log("🔍 Uploaded file:", req.file);
    
    const { service_name, description, category, icon } = req.body;
    
    // Validation
    if (!service_name || service_name.trim().length === 0) {
      return res.status(400).json({ message: "Service name is required" });
    }
    
    if (service_name.trim().length < 3) {
      return res.status(400).json({ message: "Service name must be at least 3 characters" });
    }
    
    if (service_name.trim().length > 100) {
      return res.status(400).json({ message: "Service name cannot exceed 100 characters" });
    }
    
    if (description && description.length > 500) {
      return res.status(400).json({ message: "Description cannot exceed 500 characters" });
    }

    // Create service
    const newService = new Service({
      service_name: service_name.trim(),
      description: description ? description.trim() : "",
      category: category || "Legal Service",
      icon: icon || "Custom",
      icon_file: req.file ? req.file.filename : null
    });

    await newService.save();
    console.log("✅ Service created successfully:", newService._id);

    res.status(201).json({
      message: "Service created successfully",
      service: {
        id: newService._id,
        service_name: newService.service_name,
        description: newService.description,
        category: newService.category,
        icon: newService.icon,
        icon_file: newService.icon_file,
        is_active: newService.is_active,
        created_at: newService.created_at,
        updated_at: newService.updated_at
      }
    });
  } catch (error) {
    console.error("Create service error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE Service (Admin)
router.put("/services/:id", auth, serviceUpload.single("iconFile"), async (req, res) => {
  try {
    console.log("🔍 Admin updating service:", req.params.id);
    
    const { service_name, description, category, icon } = req.body;
    const serviceId = req.params.id;
    
    // Find service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    // Validation
    if (!service_name || service_name.trim().length === 0) {
      return res.status(400).json({ message: "Service name is required" });
    }
    
    if (service_name.trim().length < 3) {
      return res.status(400).json({ message: "Service name must be at least 3 characters" });
    }
    
    if (service_name.trim().length > 100) {
      return res.status(400).json({ message: "Service name cannot exceed 100 characters" });
    }
    
    if (description && description.length > 500) {
      return res.status(400).json({ message: "Description cannot exceed 500 characters" });
    }

    // Update service
    service.service_name = service_name.trim();
    service.description = description ? description.trim() : "";
    service.category = category || "Legal Service";
    service.icon = icon || "Custom";
    
    // Update icon file if new one uploaded
    if (req.file) {
      service.icon_file = req.file.filename;
      console.log("🔍 Updated icon file:", req.file.filename);
    }
    
    service.updated_at = new Date();
    await service.save();
    
    console.log("✅ Service updated successfully:", service._id);
    console.log("🔍 Final icon_file:", service.icon_file);

    res.json({
      message: "Service updated successfully",
      service: {
        id: service._id,
        service_name: service.service_name,
        description: service.description,
        category: service.category,
        icon: service.icon,
        icon_file: service.icon_file,
        is_active: service.is_active,
        created_at: service.created_at,
        updated_at: service.updated_at
      }
    });
  } catch (error) {
    console.error("Update service error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE Service (Admin - SOFT DELETE)
router.delete("/services/:id", auth, async (req, res) => {
  try {
    console.log("🔍 Admin deleting service:", req.params.id);
    
    const serviceId = req.params.id;
    
    // Find service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    // Soft delete - mark as inactive instead of deleting
    service.is_active = false;
    service.deletedAt = new Date();
    service.deletionReason = "Admin soft delete";
    await service.save();
    
    console.log("✅ Service marked as inactive (not deleted):", service._id);

    res.json({ 
      message: "Service deleted successfully. Data preserved in database.",
      service: {
        id: service._id,
        service_name: service.service_name,
        category: service.category,
        status: "inactive",
        deletedAt: service.deletedAt
      }
    });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET DELETED/INACTIVE SERVICES (FOR ADMIN REFERENCE)
router.get("/services/deleted", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access deleted services" });
    }

    const services = await Service.find({ is_active: false }).sort({ deletedAt: -1 });
    
    const formattedServices = services.map(service => ({
      id: service._id,
      service_name: service.service_name,
      description: service.description,
      price: service.price,
      category: service.category,
      icon: service.icon,
      icon_file: service.icon_file,
      deletedAt: service.deletedAt,
      deletionReason: service.deletionReason,
      created_at: service.created_at,
      updated_at: service.updated_at
    }));

    res.json({ deletedServices: formattedServices });
  } catch (error) {
    console.error("Get deleted services error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// RESTORE DELETED SERVICE
router.put("/services/:id/restore", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can restore services" });
    }

    const serviceId = req.params.id;
    
    // Find the inactive service
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (service.is_active) {
      return res.status(400).json({ message: "Service is already active" });
    }

    // Restore the service
    service.is_active = true;
    service.deletedAt = null;
    service.deletionReason = null;
    await service.save();

    console.log("✅ Service restored successfully:", service._id);

    res.json({ 
      message: "Service restored successfully",
      service: {
        id: service._id,
        service_name: service.service_name,
        category: service.category,
        status: "active"
      }
    });
  } catch (error) {
    console.error("Restore service error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET ALL APPOINTMENTS (Admin) =====
router.get("/appointments", auth, async (req, res) => {
  try {
    console.log("🔍 Admin fetching all appointments");
    
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access all appointments" });
    }
    
    // Get all appointments (including soft deleted ones for admin view)
    const appointments = await Appointment.find({})
      .populate('user_id', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log("🔍 Total appointments found:", appointments.length);
    
    // Format appointments for frontend
    const formattedAppointments = await Promise.all(appointments.map(async (appt) => {
      // Find attorney info
      let attorneyInfo = {
        name: appt.attorneyName || 'Unknown Attorney',
        specialization: appt.attorneySpecialization || 'N/A',
        email: '',
        phone: ''
      };
      
      // Try to find attorney by attorney_id
      if (appt.attorney_id) {
        const attorney = await Attorney.findById(appt.attorney_id).lean();
        if (attorney) {
          attorneyInfo = {
            name: attorney.attorneyName || appt.attorneyName || 'Unknown Attorney',
            specialization: attorney.specialization || appt.attorneySpecialization || 'N/A',
            email: attorney.attorneyEmail || '',
            phone: attorney.attorneyPhone || ''
          };
        }
      }
      
      return {
        id: appt._id,
        date: appt.date ? new Date(appt.date).toISOString().split('T')[0] : '',
        time: appt.time || '',
        status: appt.status || 'Pending',
        isActive: appt.isActive !== false,
        patient: {
          name: appt.personalInfo?.name || appt.user_id?.name || 'Unknown Client',
          email: appt.personalInfo?.email || appt.user_id?.email || '',
          phone: appt.personalInfo?.phone || appt.user_id?.phone || ''
        },
        doctor: attorneyInfo,
        subject: appt.subject || '',
        purpose: appt.purpose || '',
        caseSummary: appt.caseSummary || '',
        documents: appt.documents || '',
        desiredOutcome: appt.desiredOutcome || '',
        attorneyFees: appt.attorneyFees || 0,
        createdAt: appt.createdAt
      };
    }));
    
    res.json({
      appointments: formattedAppointments,
      total: formattedAppointments.length
    });
  } catch (error) {
    console.error("❌ Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// ===== UPDATE APPOINTMENT STATUS (Admin) =====
router.put("/appointments/:appointmentId/status", auth, async (req, res) => {
  try {
    console.log("🔍 Admin updating appointment status");
    
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can update appointments" });
    }
    
    const { appointmentId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    appointment.status = status;
    await appointment.save();
    
    console.log("✅ Appointment status updated by admin:", appointmentId, "->", status);
    
    res.json({
      message: "Appointment status updated successfully",
      appointment: {
        id: appointment._id,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error("❌ Error updating appointment status:", error);
    res.status(500).json({ message: "Failed to update appointment status" });
  }
});

// ===== DELETE APPOINTMENT (Admin) =====
router.delete("/appointments/:appointmentId", auth, async (req, res) => {
  try {
    console.log("🔍 Admin deleting appointment");
    
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can delete appointments" });
    }
    
    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Soft delete
    appointment.isActive = false;
    appointment.deletedAt = new Date();
    appointment.deletionReason = "Deleted by admin";
    await appointment.save();
    
    console.log("✅ Appointment soft deleted by admin:", appointmentId);
    
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting appointment:", error);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

// ===== GET ALL DOCTORS/ATTORNEYS (Admin) =====
router.get("/doctors", auth, async (req, res) => {
  try {
    console.log("🔍 Admin fetching all attorneys");
    
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }
    
    const attorneys = await Attorney.find({ isActive: true })
      .select('attorneyName attorneyEmail attorneyPhone specialization fees')
      .lean();
    
    const formattedAttorneys = attorneys.map(attorney => ({
      id: attorney._id,
      name: attorney.attorneyName,
      email: attorney.attorneyEmail,
      phone: attorney.attorneyPhone,
      specialization: attorney.specialization,
      fees: attorney.fees
    }));
    
    res.json({
      doctors: formattedAttorneys,
      total: formattedAttorneys.length
    });
  } catch (error) {
    console.error("❌ Error fetching attorneys:", error);
    res.status(500).json({ message: "Failed to fetch attorneys" });
  }
});

// ===== MARK EXPIRED APPOINTMENTS =====
router.post("/mark-expired", auth, async (req, res) => {
  try {
    console.log("🔍 Admin marking expired appointments");
    
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find appointments with past dates that are still Pending or Confirmed
    const expiredAppointments = await Appointment.find({
      date: { $lt: today },
      status: { $in: ["Pending", "Confirmed"] }
    });
    
    // Update them to Expired
    let updatedCount = 0;
    for (const appt of expiredAppointments) {
      appt.status = "Expired";
      await appt.save();
      updatedCount++;
    }
    
    console.log(`✅ Marked ${updatedCount} appointments as expired`);
    
    res.json({
      message: `${updatedCount} appointments marked as expired`,
      count: updatedCount
    });
  } catch (error) {
    console.error("❌ Error marking expired appointments:", error);
    res.status(500).json({ message: "Failed to mark expired appointments" });
  }
});

module.exports = router;
