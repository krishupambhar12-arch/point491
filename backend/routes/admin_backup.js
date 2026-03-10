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
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/service-icons/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-icon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// ===== TEST ROUTE =====
router.get("/test", (req, res) => {
  res.json({ message: "Admin routes are working!" });
});

// ===== SIMPLE ADMIN LOGIN TEST =====
router.post("/login-test", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔍 Simple admin login test:", { email });

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

    // For other admins, check User table
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
    console.error("Admin login test error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== INITIALIZE DEFAULT ADMIN =====
router.post("/init-default-admin", async (req, res) => {
  try {
    console.log("🚀 Initializing default admin...");
    
    const defaultAdminEmail = "krishnapambhar@justice.com";
    const defaultAdminPassword = "krishna123";

    // Delete any existing records with this email
    await User.deleteMany({ email: defaultAdminEmail });
    await Admin.deleteMany({ email: defaultAdminEmail });
    console.log("🗑️ Cleared existing records");

    // Create default admin user
    const defaultUser = new User({
      name: "Krishna Pambhar",
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      role: "Admin"
    });

    await defaultUser.save();
    console.log("✅ Created default admin user");

    // Create admin record
    const defaultAdminRecord = new Admin({
      user_id: defaultUser._id,
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      name: "Krishna Pambhar",
      permissions: [
        "view_appointments",
        "manage_appointments", 
        "view_users",
        "manage_users",
        "view_doctors",
        "manage_doctors",
        "view_feedback",
        "manage_feedback",
        "view_services",
        "manage_services"
      ]
    });

    await defaultAdminRecord.save();
    console.log("✅ Created default admin record");

    res.json({
      message: "Default admin initialized successfully!",
      admin: {
        email: defaultAdminEmail,
        password: defaultAdminPassword,
        name: "Krishna Pambhar"
      },
      loginUrl: "/admin/login"
    });
  } catch (error) {
    console.error("Initialize admin error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===== DIRECT ADMIN CREATION =====
router.post("/create-admin-now", async (req, res) => {
  try {
    console.log("🔍 Creating admin user directly...");
    
    const adminEmail = "krishnapambhar@justice.com";
    const adminPassword = "krishna@123";

    // Delete any existing users with this email
    await User.deleteMany({ email: adminEmail });
    await Admin.deleteMany({ email: adminEmail });
    console.log("🗑️ Deleted existing records");

    // Create new admin user
    const newUser = new User({
      name: "Krishna Pambhar",
      email: adminEmail,
      password: adminPassword,
      role: "Admin"
    });

    await newUser.save();
    console.log("✅ Created new admin user:", newUser.email);

    // Create admin record
    const adminRecord = new Admin({
      user_id: newUser._id,
      email: adminEmail,
      password: adminPassword,
      name: "Krishna Pambhar",
      permissions: [
        "view_appointments",
        "manage_appointments", 
        "view_users",
        "manage_users",
        "view_doctors",
        "manage_doctors",
        "view_feedback",
        "manage_feedback",
        "view_services",
        "manage_services"
      ]
    });

    await adminRecord.save();
    console.log("✅ Created admin record");

    res.json({
      message: "Admin created successfully!",
      admin: {
        email: adminEmail,
        password: adminPassword,
        name: "Krishna Pambhar",
        userId: newUser._id,
        adminId: adminRecord._id
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===== LIST ALL ROUTES =====
router.get("/routes", (req, res) => {
  const routes = router.stack.map(layer => {
    if (layer.route) {
      return {
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      };
    }
  }).filter(route => route);

  res.json({
    message: "Available admin routes",
    routes: routes
  });
});

// ===== CHECK ADMIN USER =====
router.get("/check-admin", async (req, res) => {
  try {
    const adminEmail = "krishnapambhar@justice.com";
    
    // Check User table
    const user = await User.findOne({ email: adminEmail });
    
    // Check Admin table
    const admin = await Admin.findOne({ email: adminEmail });
    
    res.json({
      message: "Admin check results",
      userTable: user ? {
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      } : "NOT_FOUND",
      adminTable: admin ? {
        email: admin.email,
        name: admin.name,
        userId: admin.user_id,
        hasPassword: !!admin.password,
        passwordLength: admin.password?.length,
        permissions: admin.permissions
      } : "NOT_FOUND"
    });
  } catch (error) {
    console.error("Check admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DEBUG ROUTE - Check Database Structure =====
router.get("/debug-appointments", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    // Get raw appointments without populate
    const rawAppointments = await Appointment.find().limit(3).lean();
    
    // Get appointments with basic populate
    const basicPopulated = await Appointment.find().limit(3)
      .populate('user_id', 'name email phone')
      .populate('doctor_id')
      .lean();
    
    // Get appointments with nested populate
    const nestedPopulated = await Appointment.find().limit(3)
      .populate('user_id', 'name email phone')
      .populate({
        path: 'doctor_id',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .lean();

    res.json({
      rawAppointments,
      basicPopulated,
      nestedPopulated,
      message: "Debug data retrieved"
    });
  } catch (error) {
    console.error("Debug appointments error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ===== GET All Appointments (Admin) =====
router.get("/appointments", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    // First, update expired appointments to 'Expired' status
    const currentDate = new Date();
    await Appointment.updateMany(
      { 
        date: { $lt: currentDate },
        status: { $nin: ['Completed', 'Cancelled', 'Expired'] }
      },
      { status: 'Expired' }
    );

    // Get all appointments including expired ones
    const appointments = await Appointment.find({})
      .populate('user_id', 'name email phone')
      .populate({
        path: 'doctor_id',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ date: -1, time: -1 })
      .lean();

    // Check for appointments without doctor_id
    const appointmentsWithoutDoctor = appointments.filter(appt => !appt.doctor_id);
    if (appointmentsWithoutDoctor.length > 0) {
      // silent
    }

    // Format appointments for frontend
    const formattedAppointments = appointments.map(appt => ({
      id: appt._id,
      date: new Date(appt.date).toISOString().split('T')[0],
      time: appt.time,
      status: appt.status,
      symptoms: appt.symptoms,
      notes: appt.notes,
      patient: {
        id: appt.user_id?._id,
        name: appt.user_id?.name || "Unknown",
        email: appt.user_id?.email || "Unknown",
        phone: appt.user_id?.phone || "Unknown"
      },
      doctor: {
        id: appt.doctor_id?._id,
        name: appt.doctor_id?.userId?.name || "Unknown",
        email: appt.doctor_id?.userId?.email || "Unknown",
        phone: appt.doctor_id?.userId?.phone || "Unknown",
        specialization: appt.doctor_id?.specialization || "Unknown",
        fees: appt.doctor_id?.fees || 0
      },
      createdAt: appt.createdAt
    }));

    // silent

    res.json({
      appointments: formattedAppointments,
      total: formattedAppointments.length
    });
  } catch (error) {
    console.error("Admin appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE Appointment Status (Admin) =====
router.put("/appointments/:id/status", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ["Pending", "Confirmed", "Completed", "Cancelled", "Rejected", "Expired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Valid statuses are: Pending, Confirmed, Completed, Cancelled, Rejected, Expired" 
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email').populate({
      path: 'doctor_id',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({
      message: "Appointment status updated successfully",
      appointment: {
        id: appointment._id,
        date: new Date(appointment.date).toISOString().split('T')[0],
        time: appointment.time,
        status: appointment.status,
        patient: {
          name: appointment.user_id?.name,
          email: appointment.user_id?.email
        },
        doctor: {
          name: appointment.doctor_id?.userId?.name,
          specialization: appointment.doctor_id?.specialization
        }
      }
    });
  } catch (error) {
    console.error("Admin update appointment status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE Appointment (Admin) =====
router.delete("/appointments/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Admin delete appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE Appointment for User (Admin) =====
router.post("/appointments", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { user_id, doctor_id, date, time, symptoms, notes, status } = req.body;

    // Validate required fields
    if (!user_id || !doctor_id || !date || !time) {
      return res.status(400).json({ message: "User ID, Attorney ID, date, and time are required" });
    }

    // Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if attorney exists
    const attorney = await Attorney.findById(doctor_id);
    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    // Check if appointment already exists for this time slot
    const existingAppointment = await Appointment.findOne({
      doctor_id,
      date,
      time,
      status: { $in: ["Pending", "Confirmed"] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    // Create new appointment
    const appointment = new Appointment({
      user_id,
      doctor_id,
      date,
      time,
      symptoms: symptoms || "",
      notes: notes || "",
      status: status || "Confirmed" // Admin can set status directly, default to Confirmed
    });

    await appointment.save();

    // Populate appointment data for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('user_id', 'name email phone')
      .populate({
        path: 'doctor_id',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .lean();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        date: new Date(appointment.date).toISOString().split('T')[0],
        time: appointment.time,
        status: appointment.status,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        patient: {
          id: populatedAppointment.user_id._id,
          name: populatedAppointment.user_id.name,
          email: populatedAppointment.user_id.email,
          phone: populatedAppointment.user_id.phone
        },
        doctor: {
          id: populatedAppointment.doctor_id._id,
          name: populatedAppointment.doctor_id.userId?.name || "Unknown",
          specialization: populatedAppointment.doctor_id.specialization || "Unknown"
        }
      }
    });
  } catch (error) {
    console.error("Admin create appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET Admin Dashboard Stats =====
router.get("/dashboard", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    // Get admin details and permissions
    let adminDetails = null;
    try {
      adminDetails = await Admin.findOne({ user_id: req.userId })
        .populate('user_id', 'name email')
        .lean();
    } catch (error) {
      // silent
    }

    // Get statistics (Client/Attorney roles only)
    const totalClients = await User.countDocuments({ role: "Client" });
    const totalAttorneys = await User.countDocuments({ role: "Attorney" });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: "Pending" });
    const confirmedAppointments = await Appointment.countDocuments({ status: "Confirmed" });
    const completedAppointments = await Appointment.countDocuments({ status: "Completed" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "Cancelled" });
    const expiredAppointments = await Appointment.countDocuments({ status: "Expired" });

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .populate('user_id', 'name email')
      .populate({
        path: 'doctor_id',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // silent

    const formattedRecentAppointments = recentAppointments.map(appt => ({
      id: appt._id,
      date: new Date(appt.date).toISOString().split('T')[0],
      time: appt.time,
      status: appt.status,
      patient: appt.user_id?.name || "Unknown",
      doctor: appt.doctor_id?.userId?.name || "Unknown",
      specialization: appt.doctor_id?.specialization || "Unknown"
    }));

    // console.log('Dashboard - Formatted recent appointments:', JSON.stringify(formattedRecentAppointments, null, 2)); // Debug log

    res.json({
      admin: {
        name: adminDetails?.user_id?.name || "Admin",
        email: adminDetails?.user_id?.email || "",
        permissions: adminDetails?.permissions || []
      },
      stats: {
        totalClients,
        totalAttorneys,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        expiredAppointments
      },
      recentAppointments: formattedRecentAppointments
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Users (Admin) =====
router.get("/users", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
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
    console.error("Admin get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE User (Admin) =====
router.post("/users", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { name, email, password, gender, phone, address, dob } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user (role will be Client by default now)
    const user = new User({
      name,
      email,
      password,
      gender: gender || undefined,
      phone: phone || undefined,
      address: address || undefined,
      dob: dob || undefined,
      role: "Client"
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : user.dob,
        gender: user.gender,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== RESTORE DELETED USER =====
router.put("/users/:id/restore", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can restore users" });
    }

    const userId = req.params.id;

    // Find inactive user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Restore user
    user.isActive = true;
    user.deletedAt = null;
    user.deletionReason = null;
    await user.save();

    console.log("✅ User restored successfully:", user.email);

    res.json({ 
      message: "User restored successfully. Data preserved in database.",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        status: "active",
        restoredAt: new Date()
      }
    });
  } catch (error) {
    console.error("Restore user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET ALL USERS (INCLUDING INACTIVE) =====
router.get("/all-users", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const users = await User.find({})
      .select('name email role isSocialLogin profilePicture provider providerId createdAt updatedAt isActive deletedAt deletionReason')
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
      lastLoginTime: user.updatedAt ? new Date(user.updatedAt).toLocaleTimeString() : 'N/A',
      status: user.isActive ? 'active' : 'inactive',
      deletedAt: user.deletedAt ? new Date(user.deletedAt).toLocaleDateString() : null,
      deletionReason: user.deletionReason
    }));

    res.json({
      message: "All users (including inactive)",
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error("Admin get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE USER (SOFT DELETE - PREVENT ACTUAL DELETION) =====
router.delete("/users/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can delete users" });
    }

    const userId = req.params.id;

    // Find user but DO NOT delete - just mark as inactive
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mark user as inactive instead of deleting
    user.isActive = false;
    user.deletedAt = new Date();
    user.deletionReason = "Admin soft delete";
    await user.save();

    console.log(" User marked as inactive (not deleted):", user.email);

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
    console.error("Soft delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Attorneys (Admin) =====
router.get("/doctors", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const attorneys = await Attorney.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    const formattedAttorneys = attorneys.map(attorney => ({
      id: attorney._id,
      name: attorney.userId?.name || "Unknown",
      email: attorney.userId?.email || "Unknown",
      phone: attorney.userId?.phone || "Unknown",
      specialization: attorney.specialization,
      fees: attorney.fees,
      experience: attorney.experience,
      qualification: attorney.qualification,
      createdAt: attorney.createdAt
    }));

    res.json({
      attorneys: formattedAttorneys,
      total: formattedAttorneys.length
    });
  } catch (error) {
    console.error("Admin get doctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE Attorney (Admin) =====
router.post("/doctors", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { 
      userId, 
      // Professional Details
      attorneyName,
      specialization, 
      qualification, 
      experience, 
      fees,
      yearsInPractice,
      education,
      university,
      barNumber,
      licenseNumber,
      bio,
      // Contact Details
      officeAddress,
      city,
      state,
      zipCode,
      phone,
      website,
      linkedin,
      // Practice Details
      languages,
      practiceAreas,
      availableDays,
      availableTime,
      achievements
    } = req.body;

    if (!userId || !specialization || !qualification || !experience || !fees) {
      return res.status(400).json({ message: "Required fields: userId, specialization, qualification, experience, fees" });
    }

    // Parse array fields
    let parsedLanguages = [];
    let parsedPracticeAreas = [];
    let parsedAvailableDays = [];
    let parsedAchievements = [];
    let parsedAvailableTime = { start: "09:00", end: "17:00" };

    try {
      if (languages) parsedLanguages = JSON.parse(languages);
      if (practiceAreas) parsedPracticeAreas = JSON.parse(practiceAreas);
      if (availableDays) parsedAvailableDays = JSON.parse(availableDays);
      if (achievements) parsedAchievements = JSON.parse(achievements);
      if (availableTime) parsedAvailableTime = JSON.parse(availableTime);
    } catch (error) {
      console.log("Error parsing array fields:", error);
    }

    const attorney = new Attorney({
      userId,
      // Professional Details
      attorneyName: attorneyName || "",
      specialization,
      qualification,
      experience: parseInt(experience) || 0,
      fees: parseFloat(fees) || 0,
      yearsInPractice: parseInt(yearsInPractice) || 0,
      education: education || "",
      university: university || "",
      barNumber: barNumber || "",
      licenseNumber: licenseNumber || "",
      bio: bio || "",
      // Contact Details
      officeAddress: officeAddress || "",
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      phone: phone || "",
      website: website || "",
      linkedin: linkedin || "",
      // Practice Details
      languages: parsedLanguages,
      practiceAreas: parsedPracticeAreas,
      availableDays: parsedAvailableDays,
      availableTime: parsedAvailableTime,
      achievements: parsedAchievements
    });

    await attorney.save();

    const populatedAttorney = await Attorney.findById(attorney._id)
      .populate('userId', 'name email phone');

    const transformedAttorney = {
      id: populatedAttorney._id,
      name: populatedAttorney.userId?.name || populatedAttorney.attorneyName || "Unknown",
      email: populatedAttorney.userId?.email || "Unknown",
      phone: populatedAttorney.userId?.phone || populatedAttorney.phone || "Unknown",
      specialization: populatedAttorney.specialization,
      fees: populatedAttorney.fees,
      experience: populatedAttorney.experience,
      qualification: populatedAttorney.qualification,
      createdAt: populatedAttorney.createdAt,
      // Additional fields
      attorneyName: populatedAttorney.attorneyName,
      yearsInPractice: populatedAttorney.yearsInPractice,
      education: populatedAttorney.education,
      university: populatedAttorney.university,
      barNumber: populatedAttorney.barNumber,
      licenseNumber: populatedAttorney.licenseNumber,
      bio: populatedAttorney.bio,
      officeAddress: populatedAttorney.officeAddress,
      city: populatedAttorney.city,
      state: populatedAttorney.state,
      zipCode: populatedAttorney.zipCode,
      website: populatedAttorney.website,
      linkedin: populatedAttorney.linkedin,
      languages: populatedAttorney.languages,
      practiceAreas: populatedAttorney.practiceAreas,
      availableDays: populatedAttorney.availableDays,
      availableTime: populatedAttorney.availableTime,
      achievements: populatedAttorney.achievements
    };

    res.status(201).json({
      message: "Attorney created successfully",
      attorney: transformedAttorney
    });
  } catch (error) {
    console.error("Admin create attorney error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE Attorney (Admin) =====
router.put("/doctors/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    res.json({
      message: "Attorney updated successfully",
      attorney: transformedAttorney
    });
  } catch (error) {
    console.error("Admin update attorney error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE Attorney (Admin) =====
router.delete("/doctors/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    const attorney = await Attorney.findByIdAndDelete(id);

    if (!attorney) {
      return res.status(404).json({ message: "Attorney not found" });
    }

    res.json({ message: "Attorney deleted successfully" });
  } catch (error) {
    console.error("Admin delete attorney error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE Admin User =====
router.post("/create", auth, async (req, res) => {
  try {
    // Check if current user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can create other admins" });
    }

    const { userId, permissions } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already an admin
    const existingAdmin = await Admin.findOne({ user_id: userId });
    if (existingAdmin) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Create admin record
    const admin = new Admin({
      user_id: userId,
      permissions: permissions || ["view_appointments", "manage_appointments", "view_users", "view_doctors"]
    });

    await admin.save();

    // Update user role to Admin
    await User.findByIdAndUpdate(userId, { role: "Admin" });

    res.json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        userId: admin.user_id,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Admins =====
router.get("/list", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const admins = await Admin.find()
      .populate('user_id', 'name email phone role')
      .sort({ createdAt: -1 })
      .lean();

    const formattedAdmins = admins.map(admin => ({
      id: admin._id,
      name: admin.user_id?.name || "Unknown",
      email: admin.user_id?.email || "Unknown",
      phone: admin.user_id?.phone || "Unknown",
      role: admin.user_id?.role || "Admin",
      permissions: admin.permissions,
      createdAt: admin.createdAt
    }));

    res.json({
      admins: formattedAdmins,
      total: formattedAdmins.length
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE Admin Permissions =====
router.put("/permissions/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { permissions } = req.body;
    const { id } = req.params;

    const admin = await Admin.findByIdAndUpdate(
      id,
      { permissions },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email');

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Admin permissions updated successfully",
      admin: {
        id: admin._id,
        name: admin.user_id?.name,
        email: admin.user_id?.email,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error("Update admin permissions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== MARK EXPIRED APPOINTMENTS =====
router.post("/mark-expired", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const currentDate = new Date();
    const result = await Appointment.updateMany(
      { 
        date: { $lt: currentDate },
        status: { $nin: ['Completed', 'Cancelled', 'Expired'] }
      },
      { status: 'Expired' }
    );

    res.json({
      message: `${result.modifiedCount} appointments marked as expired`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark expired appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE Admin =====
router.delete("/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update user role back to Client
    await User.findByIdAndUpdate(admin.user_id, { role: "Client" });

    res.json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Feedback (Admin) =====
router.get("/feedback", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { status } = req.query;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const feedbacks = await Feedback.find(query)
      .populate('user_id', 'name email phone')
      .populate('responded_by', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formattedFeedbacks = feedbacks.map(feedback => ({
      id: feedback._id,
      subject: feedback.subject,
      message: feedback.message,
      rating: feedback.rating,
      status: feedback.status,
      admin_response: feedback.admin_response || "",
      responded_at: feedback.responded_at || null,
      user: {
        id: feedback.user_id?._id,
        name: feedback.user_id?.name || "Unknown",
        email: feedback.user_id?.email || "Unknown",
        phone: feedback.user_id?.phone || "Unknown"
      },
      responded_by: feedback.responded_by ? {
        id: feedback.responded_by._id,
        name: feedback.responded_by.name,
        email: feedback.responded_by.email
      } : null,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt
    }));

    res.json({
      feedbacks: formattedFeedbacks,
      total: formattedFeedbacks.length
    });
  } catch (error) {
    console.error("Admin get feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE Feedback Status (Admin) =====
router.put("/feedback/:id/status", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ["Pending", "Reviewed", "Resolved", "Archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Valid statuses are: Pending, Reviewed, Resolved, Archived" 
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user_id', 'name email')
      .lean();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({
      message: "Feedback status updated successfully",
      feedback: {
        id: feedback._id,
        subject: feedback.subject,
        status: feedback.status,
        user: {
          name: feedback.user_id?.name,
          email: feedback.user_id?.email
        }
      }
    });
  } catch (error) {
    console.error("Admin update feedback status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== RESPOND to Feedback (Admin) =====
router.put("/feedback/:id/respond", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { admin_response, status } = req.body;
    const { id } = req.params;

    if (!admin_response) {
      return res.status(400).json({ message: "Admin response is required" });
    }

    // Update feedback with response
    const updateData = {
      admin_response,
      responded_by: req.userId,
      responded_at: new Date()
    };

    // Update status if provided
    if (status) {
      const validStatuses = ["Pending", "Reviewed", "Resolved", "Archived"];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      }
    } else {
      // Default to Reviewed if status not provided
      updateData.status = "Reviewed";
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('user_id', 'name email')
      .populate('responded_by', 'name email')
      .lean();

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({
      message: "Response added successfully",
      feedback: {
        id: feedback._id,
        subject: feedback.subject,
        message: feedback.message,
        admin_response: feedback.admin_response,
        status: feedback.status,
        responded_at: feedback.responded_at,
        user: {
          name: feedback.user_id?.name,
          email: feedback.user_id?.email
        },
        responded_by: feedback.responded_by ? {
          name: feedback.responded_by.name,
          email: feedback.responded_by.email
        } : null
      }
    });
  } catch (error) {
    console.error("Admin respond to feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE Feedback (Admin) =====
router.delete("/feedback/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("Admin delete feedback error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Lab Tests (Admin) =====
router.get("/lab-tests", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const labTests = await LabTest.find().sort({ test_name: 1 }).lean();

    const formattedTests = labTests.map(test => ({
      id: test._id,
      test_name: test.test_name,
      description: test.description || "",
      price: test.price
    }));

    res.json({
      labTests: formattedTests,
      total: formattedTests.length
    });
  } catch (error) {
    console.error("Admin get lab tests error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE Lab Test (Admin) =====
router.post("/lab-tests", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { test_name, description, price } = req.body;

    // Validate required fields
    if (!test_name || !price) {
      return res.status(400).json({ message: "Test name and price are required" });
    }

    // Check if test with same name already exists
    const existingTest = await LabTest.findOne({ test_name: test_name.trim() });
    if (existingTest) {
      return res.status(400).json({ message: "Lab test with this name already exists" });
    }

    // Create new lab test
    const labTest = new LabTest({
      test_name: test_name.trim(),
      description: description || "",
      price: parseFloat(price)
    });

    await labTest.save();

    res.status(201).json({
      message: "Lab test created successfully",
      labTest: {
        id: labTest._id,
        test_name: labTest.test_name,
        description: labTest.description,
        price: labTest.price
      }
    });
  } catch (error) {
    console.error("Admin create lab test error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE Lab Test (Admin) =====
router.put("/lab-tests/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;
    const { test_name, description, price } = req.body;

    // Check if test exists
    const test = await LabTest.findById(id);
    if (!test) {
      return res.status(404).json({ message: "Lab test not found" });
    }

    // Check if another test with same name exists (excluding current test)
    if (test_name && test_name.trim() !== test.test_name) {
      const existingTest = await LabTest.findOne({ 
        test_name: test_name.trim(),
        _id: { $ne: id }
      });
      if (existingTest) {
        return res.status(400).json({ message: "Lab test with this name already exists" });
      }
    }

    // Update test
    const updateData = {};
    if (test_name) updateData.test_name = test_name.trim();
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);

    const updatedTest = await LabTest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    res.json({
      message: "Lab test updated successfully",
      labTest: {
        id: updatedTest._id,
        test_name: updatedTest.test_name,
        description: updatedTest.description,
        price: updatedTest.price
      }
    });
  } catch (error) {
    console.error("Admin update lab test error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE Lab Test (Admin) =====
router.delete("/lab-tests/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    // Check if test exists
    const test = await LabTest.findById(id);
    if (!test) {
      return res.status(404).json({ message: "Lab test not found" });
    }

    // Check if there are any bookings for this test
    const bookingsCount = await LabTestBooking.countDocuments({ test_id: id });
    if (bookingsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete lab test. There are ${bookingsCount} booking(s) associated with this test.` 
      });
    }

    // Delete test
    await LabTest.findByIdAndDelete(id);

    res.json({ message: "Lab test deleted successfully" });
  } catch (error) {
    console.error("Admin delete lab test error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Lab Test Bookings (Admin) =====
router.get("/lab-test-bookings", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    // Get all lab test bookings
    const bookings = await LabTestBooking.find({})
      .populate('user_id', 'name email phone')
      .populate('test_id', 'test_name description price')
      .sort({ date: -1, time: -1 })
      .lean();

    // Format bookings for frontend
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      date: new Date(booking.date).toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      notes: booking.notes || "",
      patient: {
        id: booking.user_id?._id,
        name: booking.user_id?.name || "Unknown",
        email: booking.user_id?.email || "Unknown",
        phone: booking.user_id?.phone || "Unknown"
      },
      test: {
        id: booking.test_id?._id,
        test_name: booking.test_id?.test_name || "Unknown",
        description: booking.test_id?.description || "",
        price: booking.test_id?.price || 0
      },
      createdAt: booking.createdAt
    }));

    res.json({
      bookings: formattedBookings,
      total: formattedBookings.length
    });
  } catch (error) {
    console.error("Admin get lab test bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== UPDATE Lab Test Booking Status (Admin) =====
router.put("/lab-test-bookings/:id/status", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ["Pending", "Confirmed", "Completed", "Cancelled", "Expired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Valid statuses are: Pending, Confirmed, Completed, Cancelled, Expired" 
      });
    }

    const booking = await LabTestBooking.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user_id', 'name email')
      .populate('test_id', 'test_name price')
      .lean();

    if (!booking) {
      return res.status(404).json({ message: "Lab test booking not found" });
    }

    res.json({
      message: "Lab test booking status updated successfully",
      booking: {
        id: booking._id,
        date: new Date(booking.date).toISOString().split('T')[0],
        time: booking.time,
        status: booking.status,
        patient: {
          name: booking.user_id?.name,
          email: booking.user_id?.email
        },
        test: {
          name: booking.test_id?.test_name,
          price: booking.test_id?.price
        }
      }
    });
  } catch (error) {
    console.error("Admin update lab test booking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE Lab Test Booking (Admin) =====
router.delete("/lab-test-bookings/:id", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    // Check if booking exists
    const booking = await LabTestBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Lab test booking not found" });
    }

    // Delete booking
    await LabTestBooking.findByIdAndDelete(id);

    res.json({ message: "Lab test booking deleted successfully" });
  } catch (error) {
    console.error("Admin delete lab test booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET All Consultations (Admin) =====
router.get("/consultations", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const consultations = await Consultation.find({})
      .populate('patient_id', 'name email phone')
      .populate({
        path: 'doctor_id',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ updatedAt: -1 })
      .lean();

    const formattedConsultations = consultations.map(consultation => ({
      id: consultation._id,
      client: {
        id: consultation.patient_id?._id,
        name: consultation.patient_id?.name || "Unknown",
        email: consultation.patient_id?.email || "",
        phone: consultation.patient_id?.phone || ""
      },
      attorney: {
        id: consultation.doctor_id?._id,
        name: consultation.doctor_id?.userId?.name || "Unknown",
        email: consultation.doctor_id?.userId?.email || "",
        specialization: consultation.doctor_id?.specialization || ""
      },
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
    console.error("Admin get consultations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET Messages for Consultation (Admin) =====
router.get("/consultations/:consultationId/messages", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { consultationId } = req.params;

    // Get all messages for this consultation
    const messages = await ConsultationMessage.find({ consultation_id: consultationId })
      .populate('sender_id', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      message: msg.message,
      sender_role: msg.sender_role,
      sender_name: msg.sender_id?.name || "Unknown",
      sender_email: msg.sender_id?.email || "",
      createdAt: msg.createdAt,
      read: msg.read
    }));

    res.json({
      messages: formattedMessages,
      total: formattedMessages.length
    });
  } catch (error) {
    console.error("Admin get consultation messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== SEND Reply Message in Consultation (Admin) =====
router.post("/consultations/:consultationId/reply", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can reply to consultations" });
    }

    const { consultationId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if consultation exists
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Get admin user details
    const adminUser = await User.findById(req.userId);
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    // Create message as Admin (sent as Attorney for consistency)
    const consultationMessage = new ConsultationMessage({
      consultation_id: consultationId,
      sender_id: req.userId, // Admin's user ID
      sender_role: 'Attorney',
      message: `[Admin Reply] ${message.trim()}`
    });

    await consultationMessage.save();

    // Update consultation updatedAt
    await Consultation.findByIdAndUpdate(consultationId, { updatedAt: new Date() });

    res.status(201).json({
      message: "Reply sent successfully",
      messageData: {
        id: consultationMessage._id,
        message: consultationMessage.message,
        sender_role: consultationMessage.sender_role,
        createdAt: consultationMessage.createdAt
      }
    });
  } catch (error) {
    console.error("Admin reply to consultation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== SERVICE MANAGEMENT ROUTES =====

// GET All Services
router.get("/services", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const services = await Service.find({ is_active: true })
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

    res.json({ services: transformedServices });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE Service
router.post("/services", auth, upload.single('iconFile'), async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    console.log(req.body);
    console.log(req.file);
    const { service_name, description, category } = req.body;

    if (!service_name) {
      return res.status(400).json({ message: "Service name is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Service icon file is required" });
    }

    const serviceData = {
      service_name,
      description,
      category: category || 'Legal Service',
      icon: 'Custom', // Default icon name for uploaded files
      icon_file: req.file.path // Store the full system path like "D:\justice\backend\uploads\service-icons\service-icon-123.jpg"
    };

    const service = new Service(serviceData);
    console.log(service);

    await service.save();

    const transformedService = {
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
    };

    res.status(201).json({
      message: "Service created successfully",
      service: transformedService
    });
  } catch (error) {
    console.error("Create service error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Service name already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE Service
router.put("/services/:id", auth, upload.single('iconFile'), async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;
    const { service_name, description, category } = req.body;

    if (!service_name) {
      return res.status(400).json({ message: "Service name is required" });
    }

    const updateData = {
      service_name,
      description,
      category: category || 'Legal Service',
      icon: 'Custom', // Default icon name for uploaded files
      updated_at: new Date()
    };

    // Add icon file path if file was uploaded
    if (req.file) {
      updateData.icon_file = req.file.path; // Store the full system path like "D:\justice\backend\uploads\service-icons\service-icon-123.jpg"
    }

    const service = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const transformedService = {
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
    };

    res.json({
      message: "Service updated successfully",
      service: transformedService
    });
  } catch (error) {
    console.error("Update service error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Service name already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE Service (Soft delete - set is_active to false)
router.delete("/services/:id", auth, async (req, res) => {
  try {
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access this endpoint" });
    }

    const { id } = req.params;

    const service = await Service.findByIdAndUpdate(
      id,
      { is_active: false, updated_at: new Date() },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Delete service error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== DELETE USER DATA (KEEP ADMIN) =====
router.post("/delete-user-data", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔍 Deleting user data for:", { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user in User table
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Check if user has admin record
    const adminRecord = await Admin.findOne({ user_id: user._id });
    
    if (!adminRecord) {
      return res.status(404).json({ message: "Admin record not found" });
    }

    // Delete user from User table
    await User.deleteOne({ _id: user._id });
    console.log("✅ Deleted user from User table");

    // Keep admin record intact
    console.log("✅ Admin record preserved in Admin table");

    res.json({
      message: "User data deleted successfully, admin data preserved",
      deletedUser: {
        email: user.email,
        name: user.name
      },
      preservedAdmin: {
        email: adminRecord.email,
        name: adminRecord.name,
        adminId: adminRecord._id,
        permissions: adminRecord.permissions
      }
    });
  } catch (error) {
    console.error("Delete user data error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== GET ADMIN LOGIN HISTORY =====
router.get("/login-history", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== "Admin") {
      return res.status(403).json({ message: "Only admins can access login history" });
    }

    const adminRecords = await Admin.find({})
      .select('email name lastLoginAt loginCount loginHistory')
      .sort({ lastLoginAt: -1 })
      .lean();

    const formattedHistory = adminRecords.map(admin => ({
      email: admin.email,
      name: admin.name,
      lastLoginAt: admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never',
      loginCount: admin.loginCount || 0,
      recentLogins: (admin.loginHistory || []).slice(-5).map(login => ({
        time: new Date(login.loginTime).toLocaleString(),
        ipAddress: login.ipAddress || 'Unknown',
        userAgent: login.userAgent || 'Unknown'
      }))
    }));

    res.json({
      message: "Admin login history",
      admins: formattedHistory,
      total: formattedHistory.length
    });
  } catch (error) {
    console.error("Get admin login history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== PROMOTE USER TO ADMIN =====
router.post("/promote-to-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log("🔍 Promote user to admin:", { email });

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user in User table
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Update user role to Admin
    user.role = "Admin";
    await user.save();
    console.log("✅ User promoted to admin");

    // Check if admin record exists
    let adminRecord = await Admin.findOne({ user_id: user._id });
    
    if (!adminRecord) {
      // Create admin record
      adminRecord = new Admin({
        user_id: user._id,
        email: user.email,
        password: password,
        name: user.name,
        permissions: [
          "view_appointments",
          "manage_appointments", 
          "view_users",
          "manage_users",
          "view_doctors",
          "manage_doctors",
          "view_feedback",
          "manage_feedback",
          "view_services",
          "manage_services"
        ]
      });
      await adminRecord.save();
      console.log("✅ Created admin record");
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: "Admin" 
      },
      process.env.JWT_SECRET || "secretKey",
      { expiresIn: "24h" }
    );

    res.json({
      message: "User promoted to admin successfully",
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "Admin",
        permissions: adminRecord.permissions
      }
    });
  } catch (error) {
    console.error("Promote to admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== ADMIN LOGIN =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔍 Admin login attempt:", { email, passwordLength: password?.length });

    // Validate input
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // CHECK FOR DEFAULT ADMIN CREDENTIALS
    const defaultAdminEmail = "krishnapambhar@justice.com";
    const defaultAdminPassword = "krishna123";
    
    if (email === defaultAdminEmail && password === defaultAdminPassword) {
      console.log("🔑 Using default admin credentials");
      
      // Check if default admin exists
      let user = await User.findOne({ email: defaultAdminEmail });
      
      if (!user) {
        // Create default admin user
        user = new User({
          name: "Krishna Pambhar",
          email: defaultAdminEmail,
          password: defaultAdminPassword,
          role: "Admin"
        });
        await user.save();
        console.log("✅ Created default admin user");
        
        // Create admin record
        const adminRecord = new Admin({
          user_id: user._id,
          email: defaultAdminEmail,
          password: defaultAdminPassword,
          name: "Krishna Pambhar",
          permissions: [
            "view_appointments",
            "manage_appointments", 
            "view_users",
            "manage_users",
            "view_doctors",
            "manage_doctors",
            "view_feedback",
            "manage_feedback",

console.log("✅ Default admin login successful");
  
return res.json({
message: "Admin login successful",
token,
admin: {
id: user._id,
name: user.name,
email: user.email,
role: user.role,
permissions: [
"view_appointments",
"manage_appointments", 
"view_users",
"manage_users",
"view_doctors",
"manage_doctors",
"view_feedback",
"manage_feedback",
"view_services",
"manage_services"
]
}
});
});
}

// Find user by email (for non-default admins)
const user = await User.findOne({ email });
console.log("🔍 User found:", user ? { email: user.email, role: user.role, hasPassword: !!user.password } : "NO");
  
if (!user) {
console.log("❌ User not found");
return res.status(401).json({ message: "Invalid email or password" });
}

// Check if user is admin
if (user.role !== "Admin") {
console.log("❌ User is not admin, role:", user.role);
return res.status(401).json({ message: "Access denied. Admin privileges required." });
}
    
    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is admin
    if (user.role !== "Admin") {
      console.log("❌ User is not admin, role:", user.role);
      return res.status(401).json({ message: "Access denied. Admin privileges required." });
    }

    // Verify password
    console.log("🔍 Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match result:", isMatch);
    
    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // UPDATE ADMIN TABLE WITH LOGIN DATA (NOT USER TABLE)
    await Admin.findOneAndUpdate(
      { user_id: user._id },
      { 
        lastLoginAt: new Date(),
        loginCount: await Admin.findOne({ user_id: user._id }).then(admin => admin ? admin.loginCount + 1 : 1),
        $push: {
          loginHistory: {
            loginTime: new Date(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
          }
        }
      },
      { upsert: true }
    );
    console.log("✅ Admin login data saved to Admin table");

    // Get admin details
    const adminDetails = await Admin.findOne({ user_id: user._id })
      .populate('user_id', 'name email')
      .lean();

    console.log("✅ Admin login successful for:", email);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
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
        role: user.role,
        permissions: adminDetails?.permissions || []
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE DEFAULT ADMIN (for initial setup) =====
router.post("/setup-default", async (req, res) => {
  try {
    // Check if default admin already exists
    const existingAdmin = await User.findOne({ email: "krishnapambhar@justice.com" });
    if (existingAdmin) {
      return res.status(400).json({ message: "Default admin already exists" });
    }

    // Create default admin user
    const defaultAdmin = new User({
      name: "Krishna Pambhar",
      email: "krishnapambhar@justice.com",
      password: "krishna@123",
      role: "Admin"
    });

    await defaultAdmin.save();

    // Create admin record with permissions
    const adminRecord = new Admin({
      user_id: defaultAdmin._id,
      permissions: [
        "view_appointments",
        "manage_appointments", 
        "view_users",
        "manage_users",
        "view_doctors",
        "manage_doctors",
        "view_feedback",
        "manage_feedback",
        "view_services",
        "manage_services"
      ]
    });

    await adminRecord.save();

    res.json({
      message: "Default admin user created successfully",
      admin: {
        email: "krishnapambhar@justice.com",
        password: "krishna@123",
        name: "Krishna Pambhar"
      }
    });
  } catch (error) {
    console.error("Create default admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== CREATE/UPDATE ADMIN (for user's credentials) =====
router.post("/setup-krishna-admin", async (req, res) => {
  try {
    const adminEmail = "krishnapambhar@justice.com";
    const adminPassword = "krishna@123";

    // Check if admin already exists in User table
    let existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      // Update existing user password
      existingUser.password = adminPassword; // Will be hashed by pre-save hook
      existingUser.role = "Admin";
      await existingUser.save();
      console.log("✅ Updated existing user password");
    } else {
      // Create new admin user
      const newUser = new User({
        name: "Krishna Pambhar",
        email: adminEmail,
        password: adminPassword,
        role: "Admin"
      });

      await newUser.save();
      console.log("✅ Created new admin user");
      existingUser = newUser;
    }

    // Check if admin record exists in Admin table
    let existingAdmin = await Admin.findOne({ user_id: existingUser._id });
    
    if (existingAdmin) {
      // Update existing admin record
      existingAdmin.permissions = [
        "view_appointments",
        "manage_appointments", 
        "view_users",
        "manage_users",
        "view_doctors",
        "manage_doctors",
        "view_feedback",
        "manage_feedback",
        "view_services",
        "manage_services"
      ];
      await existingAdmin.save();
      console.log("✅ Updated existing admin permissions");
    } else {
      // Create new admin record
      const adminRecord = new Admin({
        user_id: existingUser._id,
        permissions: [
          "view_appointments",
          "manage_appointments", 
          "view_users",
          "manage_users",
          "view_doctors",
          "manage_doctors",
          "view_feedback",
          "manage_feedback",
          "view_services",
          "manage_services"
        ]
      });

      await adminRecord.save();
      console.log("✅ Created new admin permissions");
    }

    // Also create a direct admin record with email for reference
    await Admin.deleteMany({ email: adminEmail }); // Remove any existing records
    const directAdminRecord = new Admin({
      user_id: existingUser._id,
      email: adminEmail, // Store email directly in Admin table
      password: adminPassword, // Store password directly in Admin table
      name: "Krishna Pambhar",
      permissions: [
        "view_appointments",
        "manage_appointments", 
        "view_users",
        "manage_users",
        "view_doctors",
        "manage_doctors",
        "view_feedback",
        "manage_feedback",
        "view_services",
        "manage_services"
      ]
    });

    await directAdminRecord.save();
    console.log("✅ Created direct admin record in Admin table");

    res.json({
      message: "Admin setup completed successfully in both User and Admin tables",
      admin: {
        email: adminEmail,
        password: adminPassword,
        name: "Krishna Pambhar",
        userId: existingUser._id,
        adminId: directAdminRecord._id
      }
    });
  } catch (error) {
    console.error("Setup admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
