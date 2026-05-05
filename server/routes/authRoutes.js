import express from "express";
import { registerUser, loginUser } from "../controllers/authControllers.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/user.js"; // 👈 ADD THIS

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Email transporter (better to move to a separate config file)

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true, // logs everything
  debug: true, // shows SMTP traffic
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  let user;
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    user = await User.findOne({ email });

    if (!user) {
      // Return success even if user not found (security best practice)
      return res.json({
        success: true,
        message: "If email exists, reset link will be sent",
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset.\n\nClick the link below (valid for 10 minutes):\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`;

    console.log("Sending reset email to:", user.email);
    console.log("Reset URL:", resetUrl);
    console.log("Using EMAIL_FROM:", process.env.EMAIL_FROM);

    // If email credentials are not configured, fallback to dev behavior (log URL)
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS ||
      !process.env.EMAIL_FROM
    ) {
      console.warn(
        "Email config missing — printed reset URL to server console for development",
      );
      return res.json({
        success: true,
        message:
          "Reset link created (email not configured). Check server logs for the link.",
        resetUrl,
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Password Reset Request - OfferLetter Decoder",
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your OfferLetter Decoder account.</p>
          <p>Click the link below to reset your password (valid for 10 minutes):</p>
          <p><a href="${resetUrl}" style="background-color: #6c63ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
          <p>Or copy this link: ${resetUrl}</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Reset email sent successfully" });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Clear tokens if they were set
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save().catch(console.error);
    }
    res
      .status(500)
      .json({ message: "Email could not be sent. Please try again later." });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; // 👈 use export default, not named export
