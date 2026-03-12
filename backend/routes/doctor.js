// back-end/routes/doctor.js (attorney routes; mounted at /attorney)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Attorney = require("../models/Attorney");
const User = require("../models/User");
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const Consultation = require("../models/Consultation");
const ConsultationMessage = require("../models/ConsultationMessage");
const Appointment = require("../models/Appointment");
const multer = require("multer");

// ===== Multer setup for file upload =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // uploads/ folder root me hona chahiye
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ===== DEBUG ROUTE - Check Attorney Data =====
router.get("/debug", async (req, res) => {
  try {
    console.log("🔍 Debug: Checking attorney data...");
    
    const allAttorneys = await Attorney.find({});
    console.log("🔍 Total attorneys found:", allAttorneys.length);
    
    const attorneyData = allAttorneys.map(att => ({
      id: att._id,
      email: att.attorneyEmail,
      name: att.attorneyName,
      hasPassword: !!att.attorneyPassword,
      passwordLength: att.attorneyPassword ? att.attorneyPassword.length : 0
    }));
    
    res.json({
      message: "Debug data",
      totalAttorneys: allAttorneys.length,
      attorneys: attorneyData
    });
  } catch (error) {
    console.error("❌ Debug error:", error);
    res.status(500).json({ message: "Debug error", error: error.message });
  }
});

// ===== ATTORNEY LOGIN =====
router.post("/login", async (req, res) => {
  try {
    console.log("🔍 Attorney login attempt:", { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // First check if any active attorneys exist in the system
    const activeAttorneysCount = await Attorney.countDocuments({ isActive: true });
    console.log("🔍 Active attorneys in system:", activeAttorneysCount);
    
    if (activeAttorneysCount === 0) {
      console.log("❌ No active attorneys found in system");
      return res.status(401).json({ 
        message: "No attorney accounts are currently active. Please contact admin to create an account." 
      });
    }

    // Debug: Check all attorneys in database
    console.log("🔍 Checking all attorneys in database...");
    const allAttorneys = await Attorney.find({});
    console.log("🔍 Total attorneys found:", allAttorneys.length);
    allAttorneys.forEach(att => {
      console.log(`  - ${att.attorneyEmail} (ID: ${att._id})`);
    });

    // Also check User model for attorneys
    console.log("🔍 Checking User model for attorneys...");
    const userAttorneys = await User.find({ role: "Attorney" });
    console.log("🔍 Total attorneys in User model:", userAttorneys.length);
    userAttorneys.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user._id})`);
    });

    // Find attorney by email in Attorney model first
    let attorney = await Attorney.findOne({ attorneyEmail: email });
    console.log("🔍 Attorney found in Attorney model:", attorney ? "Yes" : "No");
    
    // Check if attorney exists and is active
    if (!attorney) {
      console.log("❌ Attorney not found in Attorney model, checking User model...");
      
      // Check if attorney exists in User model and migrate
      const userAttorney = await User.findOne({ email, role: "Attorney" });
      if (userAttorney) {
        console.log("🔍 Found attorney in User model, migrating to Attorney model...");
        
        // Create Attorney record from User data
        const newAttorney = new Attorney({
          attorneyName: userAttorney.name,
          attorneyEmail: userAttorney.email,
          attorneyPassword: userAttorney.password,
          isActive: true
        });
        
        await newAttorney.save();
        console.log("✅ Attorney migrated to Attorney model:", newAttorney.attorneyName);
        
        // Delete from User model to avoid duplicates
        await User.deleteOne({ _id: userAttorney._id });
        console.log("🔍 Removed duplicate from User model");
        
        attorney = newAttorney;
      } else {
        console.log("❌ Attorney not found in any model");
        return res.status(401).json({ 
          message: "Attorney account not found. Please contact admin to create your account." 
        });
      }
    }
    
    // Check if attorney is active (not deleted)
    if (!attorney.isActive) {
      console.log("❌ Attorney account is deactivated:", email);
      return res.status(401).json({ 
        message: "Your account has been deactivated by admin. Please contact admin." 
      });
    }
    
    // If not found in Attorney model, check User model
    if (!attorney) {
      console.log("🔍 Checking User model for attorney...");
      const userAttorney = await User.findOne({ email, role: "Attorney" });
      if (userAttorney) {
        console.log("🔍 Attorney found in User model, creating Attorney record...");
        
        // Check if User has comparePassword method, if not, use direct bcrypt comparison
        let isPasswordMatch = false;
        try {
          if (userAttorney.comparePassword) {
            isPasswordMatch = await userAttorney.comparePassword(password);
          } else {
            // Use direct bcrypt comparison
            const bcrypt = require('bcryptjs');
            isPasswordMatch = await bcrypt.compare(password, userAttorney.password);
          }
        } catch (error) {
          console.log("❌ Password comparison error:", error.message);
        }
        
        if (!isPasswordMatch) {
          console.log("❌ Invalid password for User model attorney");
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Create Attorney record from User data
        attorney = new Attorney({
          attorneyName: userAttorney.name,
          attorneyEmail: userAttorney.email,
          attorneyPassword: userAttorney.password, // Already hashed
          attorneyPhone: userAttorney.phone || "",
          attorneyGender: userAttorney.gender || "",
          attorneyAddress: userAttorney.address || "",
          attorneyDOB: userAttorney.dateOfBirth || null,
          specialization: "",
          qualification: "",
          experience: 0,
          fees: 0,
          profilePicture: null
        });
        
        await attorney.save();
        console.log("✅ Attorney record created from User data");
        
        // Remove from User model to avoid duplicates
        await User.deleteOne({ _id: userAttorney._id });
        console.log("🔍 Removed duplicate from User model");
      }
    }
    
    if (!attorney) {
      console.log("❌ Attorney not found for email:", email);
      return res.status(404).json({ message: "Attorney not found" });
    }

    console.log("🔍 Attorney ID:", attorney._id);
    console.log("🔍 Attorney email:", attorney.attorneyEmail);
    console.log("🔍 Attorney has password:", !!attorney.attorneyPassword);

    // Check password - Attorney model has comparePassword method
    if (!attorney.attorneyPassword) {
      console.log("❌ Attorney has no password set");
      return res.status(500).json({ message: "Attorney account not properly configured" });
    }

    console.log("🔍 Attempting password comparison...");
    const isMatch = await attorney.comparePassword(password);
    console.log("🔍 Password match:", isMatch ? "Yes" : "No");
    
    if (!isMatch) {
      console.log("❌ Invalid password for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: attorney._id, role: "Attorney" },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "24h" }
    );

    console.log("✅ Attorney login successful for:", email);

    console.log("🔍 Generated token payload:", {
      id: attorney._id,
      role: "Attorney"
    });

    res.status(200).json({
      message: "Login successful",
      token,
      attorney: {
        id: attorney._id,
        name: attorney.attorneyName,
        email: attorney.attorneyEmail
      }
    });
  } catch (error) {
    console.error("❌ Attorney login error:", error);
    console.error("❌ Error type:", error.constructor.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Send specific error messages based on error type
    let errorMessage = "Server error";
    if (error.message.includes("bcrypt")) {
      errorMessage = "Password verification failed";
    } else if (error.message.includes("Cast to ObjectId failed")) {
      errorMessage = "Invalid attorney ID format";
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      errorMessage = "Database connection error";
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===== POST Attorney Details =====
router.post("/details", upload.single("profile_pic"), async (req, res) => {
  try {
    const { 
      attorneyId,
      attorneyName,
      specialization, 
      qualification, 
      experience, 
      fees
    } = req.body;

    console.log("🔍 Attorney details submission:");
    console.log("  - attorneyId:", attorneyId);
    console.log("  - attorneyName:", attorneyName);
    console.log("  - specialization:", specialization);
    console.log("  - qualification:", qualification);
    console.log("  - experience:", experience);
    console.log("  - fees:", fees);
    console.log("  - profile_pic:", req.file?.filename);

    if (!attorneyId) {
      return res.status(400).json({ message: "❌ attorneyId is required" });
    }

    if (!specialization || !qualification || !experience || !fees) {
      return res.status(400).json({ message: "❌ All fields are required" });
    }

    // Update existing attorney record
    const attorney = await Attorney.findByIdAndUpdate(
      attorneyId,
      {
        attorneyName,
        specialization,
        qualification,
        experience: parseInt(experience) || 0,
        fees: parseFloat(fees) || 0,
        profilePicture: req.file ? req.file.filename : null
      },
      { new: true }
    );

    if (!attorney) {
      return res.status(404).json({ message: "❌ Attorney not found" });
    }

    console.log("✅ Attorney details updated in 'attorneys' table:");
    console.log("  - Updated ID:", attorney._id);
    console.log("  - Updated Name:", attorney.attorneyName);
    console.log("  - Updated Specialization:", attorney.specialization);
    console.log("  - Updated Qualification:", attorney.qualification);
    console.log("  - Updated Experience:", attorney.experience);
    console.log("  - Updated Fees:", attorney.fees);

    res.status(200).json({
      message: "✅ Attorney details updated successfully!",
      attorney: {
        id: attorney._id,
        attorneyName: attorney.attorneyName,
        attorneyEmail: attorney.attorneyEmail,
        specialization: attorney.specialization,
        qualification: attorney.qualification,
        experience: attorney.experience,
        fees: attorney.fees,
        profilePicture: attorney.profilePicture
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// ===== UPDATE Attorney Profile =====
// PUT /attorney/profile  (auth required)
// Accepts multipart/form-data for optional profile_pic
router.put("/profile", auth, (req, res) => {
  // Use multer only if file is being uploaded
  upload.single("profile_pic")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: "File upload error" });
    }

    try {
      const {
        attorneyName,
        attorneyEmail,
        attorneyPhone,
        attorneyGender,
        attorneyAddress,
        attorneyDOB,
        specialization,
        qualification,
        experience,
        fees,
        removeProfilePic
      } = req.body;

      console.log("🔍 Request body:", req.body);
      console.log("🔍 removeProfilePic:", removeProfilePic);

      // Find attorney by ID (from auth middleware)
      const attorney = await Attorney.findById(req.userId);
      if (!attorney) {
        return res.status(404).json({ message: "Attorney not found" });
      }

      // Update fields - only update if value is provided and not empty
      if (attorneyName && attorneyName.trim()) attorney.attorneyName = attorneyName.trim();
      if (attorneyEmail && attorneyEmail.trim()) attorney.attorneyEmail = attorneyEmail.trim();
      if (attorneyPhone && attorneyPhone.trim()) attorney.attorneyPhone = attorneyPhone.trim();
      if (attorneyGender && attorneyGender.trim()) attorney.attorneyGender = attorneyGender.trim();
      if (attorneyAddress && attorneyAddress.trim()) attorney.attorneyAddress = attorneyAddress.trim();
      if (attorneyDOB && attorneyDOB.trim()) attorney.attorneyDOB = attorneyDOB.trim();
      if (specialization && specialization.trim()) attorney.specialization = specialization.trim();
      if (qualification && qualification.trim()) attorney.qualification = qualification.trim();
      if (experience !== undefined && experience !== "") attorney.experience = parseInt(experience) || 0;
      if (fees !== undefined && fees !== "") attorney.fees = parseFloat(fees) || 0;
      
      // Handle profile picture removal
      if (removeProfilePic === "true") {
        console.log("🔍 Removing profile picture - setting to null");
        
        // Delete the actual file from server if it exists
        if (attorney.profilePicture) {
          const oldFilePath = path.join(process.cwd(), 'uploads', attorney.profilePicture);
          console.log("🔍 Attempting to delete file:", oldFilePath);
          
          fs.unlink(oldFilePath, (err) => {
            if (err) {
              console.error("🔍 Error deleting file:", err);
            } else {
              console.log("🔍 File deleted successfully:", oldFilePath);
            }
          });
        }
        
        attorney.profilePicture = null;
      }
      
      // Handle new profile picture upload
      if (req.file) {
        console.log("🔍 Profile picture uploaded:", req.file.filename);
        console.log("🔍 Full file path:", req.file.path);
        attorney.profilePicture = req.file.filename;
      }

      await attorney.save();

      res.json({
        message: "Profile updated successfully",
        attorney: {
          id: attorney._id,
          attorneyName: attorney.attorneyName,
          attorneyEmail: attorney.attorneyEmail,
          attorneyPhone: attorney.attorneyPhone,
          attorneyGender: attorney.attorneyGender,
          attorneyAddress: attorney.attorneyAddress,
          attorneyDOB: attorney.attorneyDOB,
          specialization: attorney.specialization,
          qualification: attorney.qualification,
          experience: attorney.experience,
          fees: attorney.fees,
          profilePicture: attorney.profilePicture ? `uploads/${attorney.profilePicture}` : null
        }
      });
    } catch (e) {
      console.error("Update profile error:", e);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// GET /attorney/dashboard  -> Attorney + today's appointments count
router.get("/dashboard", auth, async (req, res) => {
  try {
    console.log("🔍 Dashboard request - userId:", req.userId);
    console.log("🔍 Dashboard request - userRole:", req.userRole);
    
    // Attorney profile (direct lookup by attorney ID)
    const attorney = await Attorney.findById(req.userId).lean();
    console.log("🔍 Attorney found:", attorney ? "Yes" : "No");
    console.log("🔍 Attorney data:", attorney);
    
    if (!attorney) {
      console.log("❌ Attorney not found for ID:", req.userId);
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Check if attorney is still active
    if (!attorney.isActive) {
      console.log("❌ Attorney account is deactivated:", req.userId);
      return res.status(401).json({ 
        message: "Your account has been deactivated by admin. Please contact support.",
        forceLogout: true,
        deactivated: true
      });
    }

    // Stats (0 if Appointment model not present)
    let todayCount = 0;
    let totalClients = 0;
    let upcomingAppointments = 0;
    let earnings = 0;

    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date();   end.setHours(23,59,59,999);

    // today count
    todayCount = await Appointment.countDocuments({
      $or: [{ attorney_id: attorney._id }, { doctor_id: attorney._id }],
      date: { $gte: start, $lte: end },
      status: { $ne: "Cancelled" }
    });

    // total unique clients seen by this attorney
    const uniqueClients = await Appointment.distinct("user_id", {
      $or: [{ attorney_id: attorney._id }, { doctor_id: attorney._id }]
    });
    totalClients = uniqueClients.length;

    // upcoming appointments from now (status pending/confirmed)
    upcomingAppointments = await Appointment.countDocuments({
      $or: [{ attorney_id: attorney._id }, { doctor_id: attorney._id }],
      date: { $gte: new Date() },
      status: { $in: ["Pending", "Confirmed"] }
    });

    // simple earnings estimate = total completed appointments * fees
    const completedCount = await Appointment.countDocuments({
      $or: [{ attorney_id: attorney._id }, { doctor_id: attorney._id }],
      status: { $in: ["Completed", "Done", "Approved"] }
    });
    earnings = completedCount * (attorney.fees || 0);

    res.json({
      attorney: {
        id: attorney._id,
        name: attorney.attorneyName,
        attorneyName: attorney.attorneyName, // Add both for compatibility
        email: attorney.attorneyEmail,
        attorneyEmail: attorney.attorneyEmail, // Add both for compatibility
        phone: attorney.attorneyPhone,
        attorneyPhone: attorney.attorneyPhone, // Add both for compatibility
        gender: attorney.attorneyGender,
        attorneyGender: attorney.attorneyGender, // Add both for compatibility
        address: attorney.attorneyAddress,
        attorneyAddress: attorney.attorneyAddress, // Add both for compatibility
        dateOfBirth: attorney.attorneyDOB,
        attorneyDOB: attorney.attorneyDOB, // Add both for compatibility
        specialization: attorney.specialization,
        qualification: attorney.qualification,
        experience: attorney.experience,
        fees: attorney.fees,
        barNumber: attorney.barNumber,
        licenseNumber: attorney.licenseNumber,
        education: attorney.education,
        university: attorney.university,
        bio: attorney.bio,
        officeAddress: attorney.officeAddress,
        city: attorney.city,
        state: attorney.state,
        zipCode: attorney.zipCode,
        website: attorney.website,
        linkedin: attorney.linkedin,
        languages: attorney.languages,
        practiceAreas: attorney.practiceAreas,
        availableDays: attorney.availableDays,
        availableTimeStart: attorney.availableTimeStart,
        availableTimeEnd: attorney.availableTimeEnd,
        profile_pic: attorney.profilePicture ? `uploads/${attorney.profilePicture}` : null
      },
      stats: {
        todayAppointments: todayCount,
        totalClients,
        upcomingAppointments,
        earnings
      }
    });
    console.log("🔍 Dashboard response - profile picture:", attorney.profilePicture);
  } catch (e) {
    console.error("Dashboard error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET Attorney Appointments =====
// GET /attorney/appointments  -> All appointments for this attorney
router.get("/appointments", auth, async (req, res) => {
  try {
    const attorneyId = req.userId;
    console.log("🔍 Appointments request for attorney:", attorneyId);
    console.log("🔍 User role:", req.userRole);
    
    // Convert to ObjectId for proper matching
    const attorneyObjectId = new mongoose.Types.ObjectId(attorneyId);
    console.log("🔍 Converted to ObjectId:", attorneyObjectId);
    
    // Find attorney profile
    let attorney = await Attorney.findById(attorneyId).lean();
    console.log("🔍 Attorney found in Attorney model:", attorney ? attorney.attorneyName : 'NOT FOUND');
    
    // If not found in Attorney model, check User model (for migrated attorneys)
    if (!attorney) {
      console.log("🔍 Checking User model for attorney...");
      const userAttorney = await User.findById(attorneyId).lean();
      if (userAttorney && userAttorney.role === 'Attorney') {
        console.log("🔍 Attorney found in User model:", userAttorney.name);
        attorney = userAttorney;
      }
    }
    
    if (!attorney) {
      console.log("❌ Attorney profile not found for ID:", attorneyId);
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Get all appointments for this attorney
    // Query by attorney_id (Attorney model) and also check Code model ID
    console.log("🔍 Querying appointments for attorney:", attorneyId);
    
    // Build list of IDs to search
    const idsToSearch = [attorneyObjectId];
    
    // Also check if this attorney has a Code model record and include that ID
    const Code = require("../models/Code");
    const codeRecord = await Code.findOne({ email: attorney.attorneyEmail }).lean();
    if (codeRecord) {
      console.log("🔍 Found Code record for attorney:", codeRecord._id);
      idsToSearch.push(new mongoose.Types.ObjectId(codeRecord._id));
    }
    
    console.log("🔍 Searching for appointments with IDs:", idsToSearch.map(id => id.toString()));
    
    const appointments = await Appointment.find({
      attorney_id: { $in: idsToSearch }
    })
      .populate('user_id', 'name email phone')
      .lean();
    
    console.log("🔍 Appointments found:", appointments.length);

    // Format appointments for frontend
    const formattedAppointments = appointments.map(appt => ({
      id: appt._id,
      patient: {
        name: appt.personalInfo?.name || appt.user_id?.name || "Unknown Client",
        email: appt.personalInfo?.email || appt.user_id?.email || "",
        phone: appt.personalInfo?.phone || appt.user_id?.phone || ""
      },
      client: appt.user_id?.name || "Unknown Client",
      clientEmail: appt.user_id?.email || "",
      clientPhone: appt.user_id?.phone || "",
      date: new Date(appt.date).toISOString().split('T')[0],
      time: appt.time,
      status: appt.status,
      subject: appt.subject,
      purpose: appt.purpose,
      caseSummary: appt.caseSummary,
      documents: appt.documents || "",
      desiredOutcome: appt.desiredOutcome,
      attorneyName: appt.attorneyName,
      attorneySpecialization: appt.attorneySpecialization,
      attorneyFees: appt.attorneyFees,
      personalInfo: appt.personalInfo,
      createdAt: appt.createdAt
    }));

    res.json({
      appointments: formattedAppointments,
      total: formattedAppointments.length
    });
  } catch (e) {
    console.error("Appointments error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Attorneys (Public) =====
// GET /attorney/all  -> Get all attorneys for public listing
router.get("/all", async (req, res) => {
  try {
    const { specialization, search } = req.query;
    
    // Get active attorneys from Code model (admin managed)
    const Code = require("../models/Code");
    const codeAttorneys = await Code.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    
    // Check which of these attorneys have actually signed up (exist in Attorney model)
    const Attorney = require("../models/Attorney");
    const signedUpAttorneys = [];
    
    for (const codeAttorney of codeAttorneys) {
      // Check if this attorney exists in Attorney model (has signed up)
      const attorneyRecord = await Attorney.findOne({ 
        attorneyEmail: codeAttorney.email 
      }).lean();
      
      if (attorneyRecord) {
        // Attorney has signed up, include them in public listing
        // IMPORTANT: Use Attorney model's _id for booking, not Code model's _id
        signedUpAttorneys.push({
          id: attorneyRecord._id, // Use Attorney model ID for booking
          codeId: codeAttorney._id, // Keep Code ID for reference
          name: codeAttorney.name || "Attorney Unknown",
          email: codeAttorney.email || "",
          phone: codeAttorney.phone || "",
          specialization: attorneyRecord.specialization || "General Practice",
          qualification: codeAttorney.qualification || "",
          experience: attorneyRecord.experience || 0,
          fees: attorneyRecord.fees || 100,
          profile_pic: attorneyRecord.profilePicture ? `uploads/${attorneyRecord.profilePicture}` : null,
          rating: 4.5,
          available: true
        });
      }
    }
    
    // Apply search filter if provided
    let filteredAttorneys = signedUpAttorneys;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filteredAttorneys = signedUpAttorneys.filter(attorney => 
        attorney.name?.match(searchRegex) ||
        attorney.qualification?.match(searchRegex) ||
        attorney.email?.match(searchRegex) ||
        attorney.specialization?.match(searchRegex)
      );
    }
    
    res.json({
      attorneys: filteredAttorneys,
      total: filteredAttorneys.length
    });
  } catch (e) {
    console.error("Get all attorneys error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== POST Book Appointment =====
router.post("/book-appointment", auth, async (req, res) => {
  console.log("🔍🔍🔍 BOOK APPOINTMENT ENDPOINT HIT!!!");
  console.log("🔍 Request method:", req.method);
  console.log("🔍 Request URL:", req.originalUrl);
  console.log("🔍 Request headers:", req.headers);
  
  try {
    console.log("🔍 Book appointment request received");
    console.log("🔍 User role:", req.userRole);
    console.log("🔍 User ID:", req.userId);
    
    // Check if user is a client
    if (req.userRole !== "Client") {
      console.log("❌ Only clients can book appointments");
      return res.status(403).json({ message: "Only clients can book appointments" });
    }

    const { 
      date, 
      attorney_id, 
      time, 
      subject,
      personalInfo,
      purpose,
      caseSummary,
      documents,
      desiredOutcome,
      attorneyName,
      attorneySpecialization,
      attorneyFees
    } = req.body;

    console.log("🔍 Appointment data:", {
      date,
      time,
      attorney_id,
      subject,
      attorneyName,
      attorneySpecialization,
      attorneyFees
    });

    if (!attorney_id || !date || !time || !subject || !personalInfo || !purpose || !caseSummary || !desiredOutcome) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Check if attorney exists in Attorney model first
    let attorney = await Attorney.findById(attorney_id);
    let actualAttorneyId = attorney_id; // Will be used to store in appointment
    
    // If not found in Attorney model, check Code model
    if (!attorney) {
      console.log("🔍 Attorney not found in Attorney model, checking Code model...");
      const Code = require("../models/Code");
      const codeAttorney = await Code.findById(attorney_id);
      
      if (codeAttorney) {
        console.log("✅ Attorney found in Code model:", codeAttorney.name);
        // Find the actual Attorney record with this email
        const actualAttorney = await Attorney.findOne({ attorneyEmail: codeAttorney.email });
        if (actualAttorney) {
          console.log("✅ Found actual Attorney record:", actualAttorney.attorneyName);
          actualAttorneyId = actualAttorney._id; // Use the Attorney model's ID
          attorney = actualAttorney;
        } else {
          // Create a temporary attorney object for booking (shouldn't happen normally)
          attorney = {
            _id: codeAttorney._id,
            attorneyName: codeAttorney.name,
            attorneyEmail: codeAttorney.email,
            attorneyPhone: codeAttorney.phone || "",
            specialization: codeAttorney.qualification || "General Practice",
            fees: 100
          };
        }
      }
    }

    if (!attorney) {
      console.log("❌ Attorney not found in any model:", attorney_id);
      return res.status(404).json({ message: "Attorney not found" });
    }

    console.log("✅ Attorney found:", attorney.attorneyName || attorney.name);

    // Check if user is trying to book appointment with themselves (if they are an attorney)
    if (req.userRole === "Attorney") {
      const userAttorney = await Attorney.findById(req.userId);
      if (userAttorney && userAttorney._id.toString() === attorney_id) {
        return res.status(400).json({ message: "Attorneys cannot book appointments with themselves" });
      }
    }

    // Check if appointment already exists for this time slot
    const existingAppointment = await Appointment.findOne({
      attorney_id: actualAttorneyId,
      date,
      time,
      status: { $in: ["Pending", "Upcoming"] }
    });

    if (existingAppointment) {
      console.log("❌ Time slot already booked");
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    // Create new appointment
    const appointment = new Appointment({
      user_id: req.userId,
      attorney_id: actualAttorneyId, // Use the Attorney model's ID
      date,
      time,
      subject,
      personalInfo,
      purpose,
      caseSummary,
      documents: documents || "",
      desiredOutcome,
      attorneyName,
      attorneySpecialization,
      attorneyFees,
      status: "Pending"
    });

    console.log("🔍 Saving appointment with all fields...");
    console.log("🔍 Appointment data preview:", {
      user_id: req.userId,
      attorney_id: actualAttorneyId,
      date,
      time,
      subject,
      personalInfo,
      purpose,
      caseSummary,
      documents: documents || "",
      desiredOutcome,
      attorneyName,
      attorneySpecialization,
      attorneyFees,
      status: "Pending"
    });
    
    await appointment.save();
    console.log("✅ Appointment saved successfully with all fields:", appointment._id);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        attorney_id: appointment.attorney_id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error("❌ Error booking appointment:", error);
    res.status(500).json({ message: "Failed to book appointment" });
  }
});

// ===== UPDATE Appointment Status =====
router.put("/appointments/:appointmentId/status", auth, async (req, res) => {
  try {
    console.log("🔍 Update appointment status request");
    console.log("🔍 User role:", req.userRole);
    console.log("🔍 User ID:", req.userId);
    
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.log("❌ Appointment not found:", appointmentId);
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if this appointment belongs to this attorney
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Check if this appointment belongs to this attorney (check both Attorney and Code model IDs)
    const Code = require("../models/Code");
    const codeRecord = await Code.findOne({ email: attorney.attorneyEmail }).lean();
    
    const validIds = [attorney._id.toString()];
    if (codeRecord) {
      validIds.push(codeRecord._id.toString());
    }
    
    const appointmentAttorneyId = appointment.attorney_id?.toString();
    if (!validIds.includes(appointmentAttorneyId)) {
      console.log("❌ Unauthorized: Appointment does not belong to this attorney");
      console.log("🔍 Appointment attorney_id:", appointmentAttorneyId);
      console.log("🔍 Valid IDs:", validIds);
      return res.status(403).json({ message: "You can only update your own appointments" });
    }

    // Update appointment status
    appointment.status = status;
    await appointment.save();

    console.log("✅ Appointment status updated:", appointmentId, "->", status);

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

// ===== DELETE Appointment =====
router.delete("/appointments/:appointmentId", auth, async (req, res) => {
  try {
    console.log("🔍 Delete appointment request");
    console.log("🔍 User role:", req.userRole);
    console.log("🔍 User ID:", req.userId);
    
    const { appointmentId } = req.params;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.log("❌ Appointment not found:", appointmentId);
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if this appointment belongs to this attorney
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Check if this appointment belongs to this attorney (check both Attorney and Code model IDs)
    const Code = require("../models/Code");
    const codeRecord = await Code.findOne({ email: attorney.attorneyEmail }).lean();
    
    const validIds = [attorney._id.toString()];
    if (codeRecord) {
      validIds.push(codeRecord._id.toString());
    }
    
    const appointmentAttorneyId = appointment.attorney_id?.toString();
    if (!validIds.includes(appointmentAttorneyId)) {
      console.log("❌ Unauthorized: Appointment does not belong to this attorney");
      return res.status(403).json({ message: "You can only delete your own appointments" });
    }

    // Soft delete - update isActive and deletedAt
    appointment.isActive = false;
    appointment.deletedAt = new Date();
    appointment.deletionReason = "Deleted by attorney";
    await appointment.save();

    console.log("✅ Appointment soft deleted:", appointmentId);

    res.json({
      message: "Appointment deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error deleting appointment:", error);
    res.status(500).json({ message: "Failed to delete appointment" });
  }
});

// ===== GET Attorney Consultations =====
router.get("/consultations", auth, async (req, res) => {
  try {
    // Check if user is an attorney
    if (req.userRole !== "Attorney") {
      return res.status(403).json({ message: "Only attorneys can access this endpoint" });
    }

    // Find attorney by userId
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    const consultations = await Consultation.find({ attorney_id: attorney._id })
      .populate('client_id', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    const formattedConsultations = consultations.map(consultation => ({
      id: consultation._id,
      patient_name: consultation.client_id?.name || "Unknown",
      patient_email: consultation.client_id?.email || "",
      status: consultation.status,
      subject: consultation.subject || "",
      createdAt: consultation.createdAt,
      updatedAt: consultation.updatedAt
    }));

    res.json({
      consultations: formattedConsultations,
      total: formattedConsultations.length
    });
  } catch (error) {
    console.error("Get doctor consultations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== SEND Message in Consultation (Attorney) =====
router.post("/consultation/:consultationId/message", auth, async (req, res) => {
  try {
    // Check if user is an attorney
    if (req.userRole !== "Attorney") {
      return res.status(403).json({ message: "Only attorneys can send messages" });
    }

    const { consultationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find attorney by userId
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Check if consultation exists and belongs to this attorney
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.attorney_id.toString() !== attorney._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to this consultation" });
    }

    // Create message
    const consultationMessage = new ConsultationMessage({
      consultation_id: consultationId,
      sender_id: req.userId,
      sender_role: 'Attorney',
      message: message.trim()
    });

    await consultationMessage.save();

    // Update consultation updatedAt
    await Consultation.findByIdAndUpdate(consultationId, { updatedAt: new Date() });

    res.status(201).json({
      message: "Message sent successfully",
      messageData: {
        id: consultationMessage._id,
        message: consultationMessage.message,
        sender_role: consultationMessage.sender_role,
        createdAt: consultationMessage.createdAt
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET Messages for Consultation (Attorney) =====
router.get("/consultation/:consultationId/messages", auth, async (req, res) => {
  try {
    // Check if user is an attorney
    if (req.userRole !== "Attorney") {
      return res.status(403).json({ message: "Only attorneys can access this endpoint" });
    }

    const { consultationId } = req.params;

    // Find attorney by userId
    const attorney = await Attorney.findById(req.userId);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney profile not found" });
    }

    // Check if consultation exists and belongs to this attorney
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (consultation.attorney_id.toString() !== attorney._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access to this consultation" });
    }

    // Get all messages for this consultation
    const messages = await ConsultationMessage.find({ consultation_id: consultationId })
      .populate('sender_id', 'name')
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      message: msg.message,
      sender_role: msg.sender_role,
      sender_name: msg.sender_id?.name || "Unknown",
      createdAt: msg.createdAt,
      read: msg.read
    }));

    // Mark client messages as read
    await ConsultationMessage.updateMany(
      { consultation_id: consultationId, sender_role: 'Client', read: false },
      { read: true }
    );

    res.json({
      messages: formattedMessages,
      total: formattedMessages.length
    });
  } catch (error) {
    console.error("Get consultation messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;