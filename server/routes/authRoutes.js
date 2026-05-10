import express from "express";
import { registerUser, loginUser } from "../controllers/authControllers.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// ─── Email transporter ─────────────────────────────────────────────────────────
// Verifies SMTP connection before trying to send.
async function createVerifiedTransporter() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Must be a Gmail App Password, NOT your account password
    },
    // Increase timeouts for slow SMTP responses
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify connection — throws if credentials are wrong
  await transporter.verify();
  return transporter;
}

// ─── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  let user;
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    user = await User.findOne({ email: email.toLowerCase().trim() });

    // Security: always return success whether user exists or not (prevent enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    // Generate token and save hashed version to DB
    const rawToken = user.getResetPasswordToken();
    await user.save();

    // Build the reset URL — points to the FRONTEND, not the backend
    // FRONTEND_URL must be set in .env, e.g.:
    //   FRONTEND_URL=https://your-app.pages.dev
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    // ── Dev shortcut: no email env vars configured ─────────────────────────────
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("⚠️  EMAIL_USER / EMAIL_PASS not set. Reset URL (dev only):", resetUrl);
      return res.json({
        success: true,
        message: "Reset link created. Check server logs (email not configured in this environment).",
        // Only expose URL in non-production
        ...(process.env.NODE_ENV !== "production" && { resetUrl }),
      });
    }

    // ── Send email ──────────────────────────────────────────────────────────────
    const transporter = await createVerifiedTransporter();

    await transporter.sendMail({
      from: `"LexAnalytica" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset — LexAnalytica",
      text: `Reset your password here (valid 10 minutes):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#6c63ff;">Password Reset Request</h2>
          <p>Click below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
          <p style="margin:28px 0;">
            <a href="${resetUrl}"
               style="background:#6c63ff;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Reset Password
            </a>
          </p>
          <p style="color:#888;font-size:13px;">Or copy this link:<br>${resetUrl}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:12px;">If you didn't request a reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    return res.json({ success: true, message: "Reset email sent. Check your inbox." });
  } catch (error) {
    console.error("Forgot password error:", error);

    // Clear tokens so they don't get stuck in DB if email failed to send
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save().catch((e) => console.error("Failed to clear reset token:", e));
    }

    // Give a specific message for SMTP auth failures (common misconfiguration)
    if (error.message?.includes("Invalid login") || error.message?.includes("535")) {
      return res.status(500).json({
        message:
          "Email configuration error. Please ensure EMAIL_USER and EMAIL_PASS (Gmail App Password) are set correctly.",
      });
    }

    return res.status(500).json({
      message: "Could not send reset email. Please try again later.",
    });
  }
});

// ─── POST /api/auth/reset-password/:token ──────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Hash the incoming raw token to match what's stored in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // must not be expired
    });

    if (!user) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    // Set new password — User model pre-save hook will hash it
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

export default router;