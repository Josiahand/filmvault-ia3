require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();

// Allow ALL origins — fixes CORS for Vercel
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth",   require("./routes/auth"));
app.use("/api/movies", require("./routes/movies"));

// AI route — only if file exists
try {
  app.use("/api/ai", require("./routes/ai"));
} catch(e) {
  console.log("AI route not loaded:", e.message);
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "FilmVault API is running 🎬", timestamp: new Date() });
});

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
