const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, "Username is required"],
      unique:    true,
      trim:      true,
      minlength: [3,  "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    // Password is optional for Google-only accounts
    password: {
      type:      String,
      minlength: [6, "Password must be at least 6 characters"],
      select:    false,
    },
    // ── Google OAuth fields ──────────────────────────────────
    googleId: {
      type:   String,
      unique: true,
      sparse: true, // allows null for non-Google users without unique collision
    },
    name: {
      type:    String,
      default: "",
    },
    picture: {
      type:    String,
      default: "",
    },
    // legacy field kept for backwards compat
    avatar: {
      type:    String,
      default: "",
    },
  },
  { timestamps: true }
);

// Hash password before saving — only when password field is set/changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only account has no password
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
