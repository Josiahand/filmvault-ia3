const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const User     = require("../models/User");
const { protect } = require("../middleware/auth");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


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

// ── @route  POST /api/auth/google ─────────────────────────────────────────────
// ── @desc   Sign in / up with Google credential token
// ── @access Public
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: "Google credential is required" });
  }

  try {
    // Verify the ID token Google sent to the frontend
    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account has no email" });
    }

    // ── Find or create user ───────────────────────────────────
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Existing user — update Google fields if they signed up via email before
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture  = picture || user.picture;
        user.name     = name    || user.name;
        await user.save();
      }
    } else {
      // New user — auto-generate a unique username from their name/email
      const base     = (name || email.split("@")[0]).replace(/\s+/g, "_").toLowerCase().slice(0, 24);
      let   username = base;
      let   attempt  = 0;
      while (await User.findOne({ username })) {
        attempt++;
        username = `${base}${attempt}`;
      }

      user = await User.create({
        googleId,
        email,
        name:     name    || "",
        picture:  picture || "",
        username,
        // No password — Google-only account
      });
    }

    res.json({
      success: true,
      message: "Google sign-in successful",
      token: generateToken(user._id),
      user: {
        id:       user._id,
        username: user.username,
        email:    user.email,
        name:     user.name,
        picture:  user.picture,
      },
    });
  } catch (error) {
    console.error("[POST /auth/google] Error:", error.message);
    res.status(401).json({ success: false, message: "Google authentication failed: " + error.message });
  }
});

// ── @route  POST /api/auth/google-profile ─────────────────────────────────────
// ── @desc   Sign in / up using raw Google profile data (from userinfo endpoint)
// ── @access Public
router.post("/google-profile", async (req, res) => {
  const { googleId, email, name, picture } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({ success: false, message: "Google profile data is incomplete" });
  }

  try {
    // Find by googleId OR email (handles users who signed up with email before)
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google to existing email-only account
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture  = picture || user.picture;
        user.name     = name    || user.name;
        await user.save();
      }
    } else {
      // Brand new user — derive a unique username
      const base     = (name || email.split("@")[0]).replace(/\s+/g, "_").toLowerCase().slice(0, 24);
      let   username = base;
      let   attempt  = 0;
      while (await User.findOne({ username })) {
        attempt++;
        username = `${base}${attempt}`;
      }

      user = await User.create({ googleId, email, name: name || "", picture: picture || "", username });
    }

    res.json({
      success: true,
      token:   generateToken(user._id),
      user:    { id: user._id, username: user.username, email: user.email, name: user.name, picture: user.picture },
    });
  } catch (error) {
    console.error("[POST /auth/google-profile] Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during Google sign-in: " + error.message });
  }
});

module.exports = router;

