import express from "express";
import { registerUser, loginUser } from "../controllers/authControllers.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user.js";

const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);

// ─── EMAIL TRANSPORTER (initialized once) ──────────────────────────
let transporter = null;

async function initTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ Email not configured – password reset will log links only.");
    return null;
  }
  try {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
    await transporter.verify();
    console.log("✅ Email transporter ready");
    return transporter;
  } catch (err) {
    console.error("❌ Email transporter failed:", err.message);
    transporter = null;
    return null;
  }
}
initTransporter();

// ─── FORGOT PASSWORD ────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email?.includes("@")) {
    return res.status(400).json({ message: "Valid email required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.json({ success: true, message: "If email exists, reset link sent." });
  }

  const rawToken = user.getResetPasswordToken();
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

  // No email config – show link in console
  if (!transporter) {
    console.log("🔗 Reset link (dev only):", resetUrl);
    return res.json({
      success: true,
      message: "Reset link generated (email not configured). Check server logs.",
      ...(process.env.NODE_ENV !== "production" && { resetUrl }),
    });
  }

  try {
    await transporter.sendMail({
      from: `"LexAnalytica" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset – LexAnalytica",
      text: `Reset your password (10 min): ${resetUrl}`,
      html: `<a href="${resetUrl}">Reset password</a> – valid 10 minutes.`,
    });
    res.json({ success: true, message: "Reset email sent." });
  } catch (err) {
    console.error("Send email error:", err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ message: "Could not send reset email. Try again later." });
  }
});

// ─── RESET PASSWORD ─────────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password min 6 chars" });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Link invalid or expired." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

export default router;