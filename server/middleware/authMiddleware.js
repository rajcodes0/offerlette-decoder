import User from "../models/user.js";
import { verifytoken } from "../utils/jwt.js";

export const authProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7); // strip 'Bearer '

    // ✅ FIXED: verifytoken can return null — check before using
    const decoded = verifytoken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // ✅ FIXED: Wrapped DB call in try/catch — malformed ID or DB outage no longer crashes server
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};