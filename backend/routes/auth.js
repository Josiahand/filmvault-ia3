const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ── Helper: generate JWT ──────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── Validation rules ──────────────────────────────────────────────────────────
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// ── @route  POST /api/auth/register ──────────────────────────────────────────
// ── @desc   Register a new user
// ── @access Public
router.post("/register", registerValidation, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    // Create user (password hashed via pre-save hook in model)
    const user = await User.create({ username, email, password });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ── @route  POST /api/auth/login ─────────────────────────────────────────────
// ── @desc   Login and get token
// ── @access Public
router.post("/login", loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

// ── @route  GET /api/auth/me ──────────────────────────────────────────────────
// ── @desc   Get logged-in user profile
// ── @access Private
router.get("/me", protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;
