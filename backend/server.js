require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

// Allow all origins (works for both localhost and Vercel)
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all vercel domains, localhost, and render
    const allowed = [
      "http://localhost:5173",
      "http://localhost:3000",
    ];
    if (
      allowed.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",   require("./routes/auth"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/ai",     require("./routes/ai"));

app.get("/api/health", (req, res) => res.json({ success: true, message: "FilmVault API is running 🎬", timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});
