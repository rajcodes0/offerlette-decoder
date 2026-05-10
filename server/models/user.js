/**
 * models/user.js
 *
 * User model with:
 * - bcrypt password hashing (pre-save hook)
 * - comparePassword instance method
 * - getResetPasswordToken instance method (required by authRoutes.js)
 * - isPremium field (for payment upgrade)
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: true, // included by default; middleware strips it when needed
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    // Password reset fields
    resetPasswordToken: {
      type: String,
      select: false, // don't return by default
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save: hash password if modified ──────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: generate password reset token ───────────────────────────
// Stores a hashed version in the DB, returns the raw token for the email link.
userSchema.methods.getResetPasswordToken = function () {
  // Generate 32 random bytes as the raw token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash and store in DB — never store the raw token in the DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // Token expires in 10 minutes
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return rawToken; // Return raw token — this goes in the email link
};

const User = mongoose.model("User", userSchema);
export default User;