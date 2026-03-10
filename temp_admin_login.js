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
