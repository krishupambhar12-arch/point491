const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Attorney = require("../models/Attorney");
const Appointment = require("../models/Appointment");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const multer = require("multer");

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "secretKey", {
    expiresIn: "24h",
  });
};

// ===== TEST ROUTE =====
router.get("/test", (req, res) => {
  res.json({ 
    message: "User routes are working!",
    timestamp: new Date().toISOString(),
    server: "Backend is running correctly"
  });
});

// ===== USER REGISTRATION =====
router.post("/register", async (req, res) => {
  try {
    console.log("🔍 Registration attempt started");
    const { name, email, password, role, phone, address, dateOfBirth, gender } = req.body;

    console.log("🔍 Registration data:", { name, email, role, phone, address, dateOfBirth, gender });

    // Validate input
    if (!name || !email || !password || !role) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Name, email, password, and role are required" });
    }

    if (role === "Attorney") {
      console.log("🔍 Attorney registration detected");
      
      // Check if attorney already exists in Attorney model
      const existingAttorney = await Attorney.findOne({ attorneyEmail: email });
      if (existingAttorney) {
        return res.status(400).json({ message: "Attorney with this email already exists" });
      }
      
      // Double check: Make sure no User record exists with this email for attorney role
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log("⚠️ Found User record for attorney email - deleting it");
        await User.deleteOne({ email });
      }
      
      // Create attorney record directly (password will be hashed by pre-save hook)
      console.log("🔍 Creating attorney with email:", email);
      console.log("🔍 Attorney data:", { name, email, phone, gender, address, dateOfBirth });
      
      const attorney = new Attorney({
        attorneyName: name,
        attorneyEmail: email,
        attorneyPassword: password, // Let the pre-save hook handle hashing
        attorneyPhone: phone || "",
        attorneyGender: gender || "",
        attorneyAddress: address || "",
        attorneyDOB: dateOfBirth || null,
        
        // Professional Information
        specialization: req.body.specialization || "",
        qualification: req.body.qualification || "",
        experience: req.body.experience || 0,
        consultationFees: req.body.consultationFees || 0,
        barNumber: req.body.barNumber || "",
        licenseNumber: req.body.licenseNumber || "",
        education: req.body.education || "",
        university: req.body.university || "",
        bio: req.body.bio || "",
        
        // Contact Information
        officeAddress: req.body.officeAddress || "",
        city: req.body.city || "",
        state: req.body.state || "",
        zipCode: req.body.zipCode || "",
        website: req.body.website || "",
        linkedin: req.body.linkedin || "",
        
        // Practice Information
        languages: req.body.languages || "",
        practiceAreas: req.body.practiceAreas || "",
        availableDays: req.body.availableDays || "",
        availableTimeStart: req.body.availableTimeStart || "09:00",
        availableTimeEnd: req.body.availableTimeEnd || "17:00",
        
        profilePicture: req.file ? req.file.filename : null
      });

      await attorney.save();
      console.log("✅ Attorney saved to 'attorneys' table with ID:", attorney._id);
      console.log("🔍 Saved attorney details:");
      console.log("  - Name:", attorney.attorneyName);
      console.log("  - Email:", attorney.attorneyEmail);
      console.log("  - Phone:", attorney.attorneyPhone);
      console.log("  - Gender:", attorney.attorneyGender);
      console.log("  - Address:", attorney.attorneyAddress);
      console.log("  - DOB:", attorney.attorneyDOB);
      console.log("🔍 Saved password hash length:", attorney.attorneyPassword.length);

      // Generate token for attorney
      const token = generateToken(attorney._id, "Attorney");

      res.status(201).json({
        message: "Attorney registered successfully",
        token,
        attorney: {
          id: attorney._id,
          attorneyName: attorney.attorneyName,
          attorneyEmail: attorney.attorneyEmail,
          role: "Attorney"
        },
      });
    } else {
      console.log("🔍 Non-attorney registration - using User table");
      // Check if user already exists for non-attorney roles
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if attorney exists with this email
      const existingAttorney = await Attorney.findOne({ attorneyEmail: email });
      if (existingAttorney) {
        console.log("⚠️ Found Attorney record for non-attorney email - deleting it");
        await Attorney.deleteOne({ attorneyEmail: email });
      }

      // Hash password for regular users (User model has pre-save hook too)
      const user = new User({
        name,
        email,
        password: password, // Let the pre-save hook handle hashing
        role: "Client"
      });

      await user.save();

      // Generate token for user
      const token = generateToken(user._id, "Client");

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "Client",
        },
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// ===== USER LOGIN =====
router.post("/login", async (req, res) => {
  try {
    console.log("🔍 User login attempt started");
    const { email, password } = req.body;

    console.log("🔍 Login data:", { email, passwordLength: password?.length });

    // Validate input
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if attorney first
    const attorney = await Attorney.findOne({ attorneyEmail: email });
    console.log("🔍 Attorney lookup:", { email, found: !!attorney });
    
    if (attorney) {
      console.log("🔍 Attorney login attempt detected");
      
      // Check if attorney is active (not deleted)
      if (!attorney.isActive) {
        console.log("❌ Attorney account is deactivated:", email);
        return res.status(401).json({ message: "Your account has been deactivated by admin. Please contact admin." });
      }
      
      console.log("🔍 Comparing passwords for attorney:", attorney.attorneyEmail);
      // Check password
      const isMatch = await bcrypt.compare(password, attorney.attorneyPassword);
      console.log("🔍 Password match result:", isMatch);
      
      if (!isMatch) {
        console.log("❌ Password mismatch for attorney:", attorney.attorneyEmail);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log("✅ Attorney login successful:", attorney.attorneyEmail);
      // Generate token
      const token = generateToken(attorney._id, "Attorney");

      return res.json({
        message: "Attorney login successful",
        token,
        attorney: {
          id: attorney._id,
          attorneyName: attorney.attorneyName,
          attorneyEmail: attorney.attorneyEmail,
          role: "Attorney"
        },
      });
    } else {
      // Attorney not found in database
      console.log("❌ Attorney not found in database");
      return res.status(401).json({ 
        message: "Attorney account not found. Please contact admin to create your account." 
      });
    }

    // If not attorney, check regular user
    console.log("🔍 Regular user login attempt");
    const user = await User.findOne({ email });
    console.log("🔍 User lookup:", { email, found: !!user });
    
    if (!user) {
      console.log("❌ User not found for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log("❌ User account is inactive:", email);
      return res.status(400).json({ message: "Account is inactive. Please contact admin." });
    }

    console.log("🔍 Comparing passwords for user:", user.email);
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match result:", isMatch);
    
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", user.email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    console.log("✅ User authentication successful for:", user.email);

    // Generate token
    const token = generateToken(user._id, user.role);

    const response = {
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    console.log("✅ Sending successful login response for:", user.email);
    return res.json(response);
  } catch (error) {
    console.error("❌ Login error:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Ensure JSON response even on error
    if (!res.headersSent) {
      return res.status(500).json({ 
        message: "Server error during login",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// ===== GET USER PROFILE =====
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        profilePicture: user.profilePicture,
        isSocialLogin: user.isSocialLogin,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE USER PROFILE =====
router.put("/profile", auth, upload.single("profilePicture"), async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, address, dateOfBirth, dob, gender } = req.body;
    
    console.log("🔍 Profile update request:", { userId, name, phone, address, dateOfBirth, dob, gender });
    console.log("🔍 File received:", req.file ? req.file.filename : 'No file');
    console.log("🔍 Request body keys:", Object.keys(req.body));
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🔍 User found:", user.email);

    // Update user fields only if they are provided
    // Support both 'dob' (from frontend) and 'dateOfBirth' (alternative)
    const dobValue = dob || dateOfBirth;
    if (name !== undefined && name !== '') user.name = name;
    if (phone !== undefined && phone !== '') user.phone = phone;
    if (address !== undefined && address !== '') user.address = address;
    if (dobValue !== undefined && dobValue !== '') user.dateOfBirth = new Date(dobValue);
    if (gender !== undefined && gender !== '') user.gender = gender;
    
    // Update profile picture if uploaded
    if (req.file) {
      user.profilePicture = req.file.filename;
      console.log("📸 Profile picture updated:", req.file.filename);
    } else {
      console.log("📸 No profile picture uploaded");
    }

    await user.save();
    console.log("✅ Profile updated successfully");

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        profilePicture: user.profilePicture,
        isSocialLogin: user.isSocialLogin,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CLIENT DASHBOARD =====
router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    console.log("🔍 Client dashboard request:", { userId, userRole });

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's appointments
    const appointments = await Appointment.find({ userId })
      .sort({ date: -1 })
      .limit(5);

    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.date) > new Date() && apt.status !== 'Cancelled'
    ).length;

    const completedAppointments = appointments.filter(apt => 
      apt.status === 'Completed'
    ).length;

    const totalVisits = appointments.length;

    res.json({
      message: "Dashboard data loaded successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      stats: {
        totalVisits,
        upcomingAppointments,
        completedAppointments,
        totalBills: 0 // Can be calculated later
      },
      recentAppointments: appointments.map(apt => ({
        id: apt._id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        attorneyName: apt.attorneyName || 'Not assigned'
      }))
    });
  } catch (error) {
    console.error("❌ Client dashboard error:", error);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
});

// ===== GET USER APPOINTMENTS =====
router.get("/appointments", auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const appointments = await Appointment.find({ userId })
      .sort({ date: -1 });

    res.json({
      appointments: appointments.map(apt => ({
        id: apt._id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        attorneyName: apt.attorneyName || 'Not assigned',
        notes: apt.notes || ''
      }))
    });
  } catch (error) {
    console.error("❌ Get appointments error:", error);
    res.status(500).json({ message: "Failed to load appointments" });
  }
});

// ===== TEST USER MODEL =====
router.get("/test-user-model", async (req, res) => {
  try {
    console.log("🔍 Testing User model...");
    
    // Test creating a user
    const testUser = new User({
      name: "Test User",
      email: "test@example.com",
      password: "test123",
      role: "Client"
    });

    console.log("🔍 Test user created:", testUser);
    
    // Test validation
    const validationError = testUser.validateSync();
    if (validationError) {
      console.error("❌ User model validation error:", validationError);
      return res.status(500).json({ 
        message: "User model validation failed",
        error: validationError.message 
      });
    }

    console.log("✅ User model validation passed");
    res.json({ 
      message: "User model test successful",
      testUser: {
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
        isValid: !validationError
      }
    });
  } catch (error) {
    console.error("❌ User model test error:", error);
    res.status(500).json({ 
      message: "User model test failed",
      error: error.message 
    });
  }
});

// ===== USER FORGOT PASSWORD =====
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log("🔍 User forgot password request:", { email, newPasswordLength: newPassword?.length });

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find user by email in User model
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Update password - User model will handle hashing via pre-save hook
    user.password = newPassword;
    await user.save();

    console.log("✅ User password updated successfully for:", email);

    res.status(200).json({
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("❌ User forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== ATTORNEY FORGOT PASSWORD =====
router.post("/attorney-forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    console.log("🔍 Attorney forgot password request:", { email, newPasswordLength: newPassword?.length });

    // Validate input
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find attorney by email in Attorney model
    const attorney = await Attorney.findOne({ attorneyEmail: email });
    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found with this email" });
    }

    // Update password - Attorney model will handle hashing via pre-save hook
    attorney.attorneyPassword = newPassword;
    await attorney.save();

    console.log("✅ Attorney password updated successfully for:", email);

    res.status(200).json({
      message: "Attorney password updated successfully"
    });
  } catch (error) {
    console.error("❌ Attorney forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
