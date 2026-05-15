import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = "7d";

// ─── Startup guard ───────────────────────────────────────────────────
if (!JWT_SECRET) {
  console.error(
    "❌ JWT_SECRET is missing from environment variables. Auth will fail at runtime."
  );
}

export const generateToken = (userId) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured — cannot sign tokens");
  }
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const verifytoken = (token) => {
  if (!JWT_SECRET) {
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    // Invalid / expired token — intentionally silent (not a server error)
    return null;
  }
};