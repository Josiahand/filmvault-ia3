const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");

router.use(protect);

// POST /api/ai/recommendations
router.post("/recommendations", async (req, res) => {
  const { watchedMovies } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ success: false, message: "ANTHROPIC_API_KEY not set in .env file" });
  }

  const titles = (watchedMovies || [])
    .map(m => `${m.title} (${m.genre}, ${m.rating}/5 stars, ${m.type === "tv" ? "TV Show" : "Movie"})`)
    .join(", ");

  const prompt = titles
    ? `Based on these movies and shows I have watched: ${titles} — suggest 4 things I would enjoy next (can be movies or TV shows). For each give a title, year, type (movie or tv), and a 1 sentence reason. Respond ONLY with a JSON array like: [{"title":"...","year":"...","type":"movie","reason":"..."}]. No other text.`
    : `Suggest 4 great movies or TV shows to start watching. Respond ONLY with a JSON array: [{"title":"...","year":"...","type":"movie","reason":"..."}]. No other text.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ success: false, message: data.error?.message || "Claude API error" });
    }

    const text  = data.content?.map(c => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const recs  = JSON.parse(clean);

    res.json({ success: true, recommendations: recs });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get recommendations: " + e.message });
  }
});

module.exports = router;
