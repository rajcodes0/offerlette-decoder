// server/models/user.js
// ✅ This is the complete User model.
// getResetPasswordToken() was likely missing from your model — that's why reset password crashed.

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
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    // ✅ Reset password fields — required for forgot/reset flow
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpire: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if password field was modified (prevents double-hashing)
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Compare plain password with hash ────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// ─── Generate reset token ─────────────────────────────────────────────────────
// ✅ This method was the missing piece — authRoutes calls user.getResetPasswordToken()
// How it works:
//   1. Generate a random 32-byte hex token (this is what gets emailed)
//   2. Hash it with SHA-256 and store the HASH in DB (never store raw token in DB)
//   3. Set expiry to 10 minutes from now
//   4. Return the RAW token (for the email link)
//   5. On reset: hash the incoming token and compare with DB hash
userSchema.methods.getResetPasswordToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return rawToken; // return the unhashed version for the email
};

const User = mongoose.model("User", userSchema);
export default User;