import express from "express";
import { registerUser, loginUser } from "../controllers/authControllers.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
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
  logger: true,   // logs everything
  debug: true     // shows SMTP traffic
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  let user; // 👈 declare outside try/catch
  try {
    const { email } = req.body;
    user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const resetToken = user.getResetPasswordToken();
    await user.save();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset.\n\nClick the link below (valid for 10 minutes):\n${resetUrl}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      text: message
    });
    
    res.json({ success: true, message: 'Reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Only clear tokens if user was found
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save().catch(console.error);
    }
    res.status(500).json({ message: 'Email could not be sent' });
  }
});

// Reset password
// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body; // only password needed

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Remove the confirmPassword check entirely (or add it back if you want both)
    // If you want to keep confirmPassword, uncomment:
    // const { password, confirmPassword } = req.body;
    // if (password !== confirmPassword) { ... }

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

    // Optionally generate a new JWT token – but you need to import generateToken
    // If you don't have a generateToken function, you can skip this and just return success
    // For now, I'll comment it out:
    // const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Password updated",
      // token, // uncomment if you have generateToken imported
    });
  } catch (error) {
    console.error("Reset password error:", error); // log the actual error
    res.status(500).json({ message: "Server error" });
  }
});

export default router; // 👈 use export default, not named export