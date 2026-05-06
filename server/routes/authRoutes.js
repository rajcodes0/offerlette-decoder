import express from "express";
import { registerUser, loginUser } from "../controllers/authControllers.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ─── Email transporter (lazy init so missing config doesn't crash startup) ───

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password, not your account password
    },
  });
}

// ─── Forgot password ──────────────────────────────────────────────────────────

router.post("/forgot-password", async (req, res) => {
  let user;
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    user = await User.findOne({ email });

    if (!user) {
      // Security: don't reveal whether email exists
      return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    // ✅ FIXED: getResetPasswordToken() must exist on User model (see note below)
    // It generates a raw token, hashes it, stores the hash on user, returns the raw token
    const rawToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

    // Dev fallback — no email configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  Email not configured — Reset URL (dev only):", resetUrl);
      return res.json({
        success: true,
        message: "Reset link created. Check server logs (email not configured).",
        ...(process.env.NODE_ENV === "development" && { resetUrl }), // only expose in dev
      });
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"OfferLetter Decoder" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset - OfferLetter Decoder",
      text: `Reset your password here (valid 10 minutes):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6c63ff;">Password Reset Request</h2>
          <p>Click the button below to reset your password. This link is valid for <strong>10 minutes</strong>.</p>
          <p style="margin: 28px 0;">
            <a href="${resetUrl}"
               style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Reset Password
            </a>
          </p>
          <p style="color:#888;font-size:13px;">Or copy this link: ${resetUrl}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:12px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Reset email sent successfully" });
  } catch (error) {
    console.error("Forgot password error:", error);

    // ✅ FIXED: Clear tokens on failure so they don't get stuck in DB
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save().catch(console.error);
    }

    res.status(500).json({ message: "Could not send reset email. Please try again later." });
  }
});

// ─── Reset password ───────────────────────────────────────────────────────────

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // ✅ FIXED: Hash the incoming raw token to compare with what's stored in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired. Please request a new one." });
    }

    // Update password (pre-save hook on User model should hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ success: true, message: "Password updated successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

export default router;