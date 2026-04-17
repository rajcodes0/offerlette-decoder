import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "password must be 6 characters long"],
      
    },

    resetPasswordToken:String,
    resetPasswordExpire:Date
  },
  { timestamps: true },
);

// Hashing the password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Comparing password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)   // ← fix this line
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
}







const User = mongoose.model("User", userSchema);
export default User;
