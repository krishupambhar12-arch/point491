const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Attorney = require("../models/Attorney");
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "secretKey", {
    expiresIn: "1d",
  });
};

// User Registration
router.post("/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      address,
      dateOfBirth,
      gender,
      role
    } = req.body;

    // Extra validation: Prevent attorney data from going to User table
    if (role === "Attorney") {
      console.log("🔍 Attorney registration - ensuring data goes to Attorney table only");
      
      // Check if attorney already exists in Attorney table
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
      const attorney = new Attorney({
        attorneyName: name,
        attorneyEmail: email,
        attorneyPassword: password, // Let the pre-save hook handle hashing
        attorneyPhone: phone || "",
        attorneyGender: gender || "",
        attorneyAddress: address || "",
        attorneyDOB: dateOfBirth || null,
        specialization: "",
        qualification: "",
        experience: 0,
        fees: 0,
        profilePicture: req.file ? req.file.filename : null
      });

      await attorney.save();
      console.log("✅ Attorney saved with ID:", attorney._id);
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
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Double check: Make sure no Attorney record exists for non-attorney role
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

// User Login
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
        }
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
    res.status(500).json({ message: "Server error during login" });
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

module.exports = router;

    // Update attorney password (will be hashed by pre-save hook)
    console.log("🔍 Updating attorney password...");
    attorney.attorneyPassword = newPassword;
    await attorney.save();

    console.log("✅ Attorney password updated successfully");

    res.json({
      message: "Attorney password updated successfully! You can now login with your new password.",
      attorney: {
        id: attorney._id,
        attorneyName: attorney.attorneyName,
        attorneyEmail: attorney.attorneyEmail
      }
    });

  } catch (error) {
    console.error("❌ Attorney forgot password error:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// Set Password for Google Users
router.post("/set-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is a Google user
    if (!user.isSocialLogin || user.provider !== 'google') {
      return res.status(400).json({ message: "This feature is only for Google users" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({
      message: "Password set successfully! You can now login with your email and password.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get User Profile
router.get("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    const user = await User.findById(decoded.id).select("-password");

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
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update User Profile
router.put("/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { name, phone, address },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth
router.post("/auth/google", async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        message: "Authorization code is required",
        error: "MISSING_CODE"
      });
    }
    
    console.log('🔍 Google OAuth: Exchanging code for tokens...');
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, id_token, refresh_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.status(400).json({ 
        message: "Failed to obtain access token from Google",
        error: "TOKEN_EXCHANGE_FAILED"
      });
    }
    
    // Get user info from Google with enhanced scopes
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { email, name, picture, id: googleId, verified_email } = userInfoResponse.data;
    
    // Validate email is verified
    if (!verified_email) {
      return res.status(400).json({ 
        message: "Please verify your Google account email first",
        error: "EMAIL_NOT_VERIFIED"
      });
    }
    
    console.log('👤 Google user info:', { email, name, googleId, verified: verified_email });
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user for social login with real-world defaults
      user = new User({
        name: name || email.split('@')[0], // Fallback to email username
        email,
        password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Stronger random password
        role: 'Client', // Default role for social login
        isSocialLogin: true,
        profilePicture: picture,
        provider: 'google',
        providerId: googleId,
        phone: '', // Empty for now, user can update later
        address: '', // Empty for now, user can update later
        createdAt: new Date()
      });
      await user.save();
      console.log('✅ New Google user created:', { email, name, role: user.role });
    } else {
      // Update existing user with Google info if needed
      let needsUpdate = false;
      
      if (!user.isSocialLogin) {
        user.isSocialLogin = true;
        user.provider = 'google';
        user.providerId = googleId;
        needsUpdate = true;
      }
      
      if (!user.profilePicture && picture) {
        user.profilePicture = picture;
        needsUpdate = true;
      }
      
      if (user.name !== name && name) {
        user.name = name;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        console.log('🔄 Existing user updated with Google info:', { email, name });
      }
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        provider: user.provider,
        isSocialLogin: user.isSocialLogin
      }
    });

  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
});

// Facebook OAuth
router.post("/auth/facebook", async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for tokens
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenResponse.data;
    
    // Get user info from Facebook
    const userInfoResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token
      }
    });

    const { id: facebookId, name, email, picture } = userInfoResponse.data;
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        name,
        email,
        password: Math.random().toString(36).slice(-8),
        role: 'Client',
        isSocialLogin: true,
        profilePicture: picture?.data?.url,
        provider: 'facebook',
        providerId: facebookId
      });
      await user.save();
    } else {
      if (!user.isSocialLogin) {
        user.isSocialLogin = true;
        user.provider = 'facebook';
        user.providerId = facebookId;
        if (!user.profilePicture) {
          user.profilePicture = picture?.data?.url;
        }
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        provider: user.provider,
        isSocialLogin: user.isSocialLogin
      }
    });

  } catch (error) {
    console.error("Facebook auth error:", error);
    res.status(500).json({ message: "Facebook authentication failed" });
  }
});

// LinkedIn OAuth
router.post("/auth/linkedin", async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      `grant_type=authorization_code&code=${code}&redirect_uri=${process.env.LINKEDIN_REDIRECT_URI}&client_id=${process.env.LINKEDIN_CLIENT_ID}&client_secret=${process.env.LINKEDIN_CLIENT_SECRET}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token } = tokenResponse.data;
    
    // Get user info from LinkedIn
    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const { id: linkedinId, firstName, lastName, emailAddress, profilePicture } = userInfoResponse.data;
    const name = `${firstName.localized.en_US} ${lastName.localized.en_US}`;
    
    // Find or create user
    let user = await User.findOne({ email: emailAddress });
    
    if (!user) {
      user = new User({
        name,
        email: emailAddress,
        password: Math.random().toString(36).slice(-8),
        role: 'Client',
        isSocialLogin: true,
        profilePicture: profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier,
        provider: 'linkedin',
        providerId: linkedinId
      });
      await user.save();
    } else {
      if (!user.isSocialLogin) {
        user.isSocialLogin = true;
        user.provider = 'linkedin';
        user.providerId = linkedinId;
        if (!user.profilePicture) {
          user.profilePicture = profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier;
        }
        await user.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        provider: user.provider,
        isSocialLogin: user.isSocialLogin
      }
    });

  } catch (error) {
    console.error("LinkedIn auth error:", error);
    res.status(500).json({ message: "LinkedIn authentication failed" });
  }
});

// Get Client Dashboard Data
router.get("/dashboard", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return dashboard data
    res.json({
      message: "Dashboard data retrieved successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        isSocialLogin: user.isSocialLogin,
        provider: user.provider
      },
      stats: {
        totalAppointments: 0, // You can add actual appointment count later
        upcomingAppointments: 0,
        completedAppointments: 0
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Failed to retrieve dashboard data" });
  }
});

// Get Client Appointments
router.get("/appointments", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // For now, return empty appointments array
    // You can implement actual appointment logic later
    res.json({
      message: "Appointments retrieved successfully",
      appointments: [],
      stats: {
        totalAppointments: 0,
        upcomingAppointments: 0,
        completedAppointments: 0
      }
    });

  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ message: "Failed to retrieve appointments" });
  }
});

// User Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    console.log("🔍 User forgot password request received");
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    console.log("✅ User password updated successfully for:", email);
    res.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("User forgot password error:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

module.exports = router;
