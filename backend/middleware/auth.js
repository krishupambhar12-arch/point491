const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "❌ No token, access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    console.log("🔍 Auth Debug - Token decoded:", { userId: decoded.id, userRole: decoded.role, email: decoded.email });
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    res.status(401).json({ message: "❌ Invalid token" });
  }
};

module.exports = authMiddleware;
