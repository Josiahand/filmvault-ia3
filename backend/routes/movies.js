const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Movie = require("../models/Movie");
const { protect } = require("../middleware/auth");

router.use(protect);

const ALL_GENRES = [
  "Action","Animation","Comedy","Crime","Documentary","Drama",
  "Fantasy","Horror","Romance","Sci-Fi","Thriller","Other",
  "Adventure","Family","History","Music","Mystery",
  "Science Fiction","TV Movie","War","Western",
  "Sci-Fi & Fantasy","Action & Adventure",
  "Kids","News","Reality","Soap","Talk","War & Politics",
];

const movieValidation = [
  body("title").optional().trim().notEmpty().withMessage("Title cannot be empty").isLength({ max: 200 }),
  body("type").optional().isIn(["movie", "tv"]).withMessage("Type must be movie or tv"),
  body("status").optional().isIn(["watchlist", "watched", "watching"]).withMessage("Invalid status"),
  body("rating").optional().isInt({ min: 0, max: 5 }).withMessage("Rating must be 0-5"),
  body("genre").optional().isIn(ALL_GENRES).withMessage("Invalid genre"),
  body("review").optional().isLength({ max: 2000 }),
  body("watchedEpisodes").optional().isInt({ min: 0 }),
  body("currentSeason").optional().isInt({ min: 1 }),
];

// GET all
router.get("/", async (req, res) => {
  try {
    const { status, genre, type, sort = "-createdAt" } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (genre)  filter.genre  = genre;
    if (type)   filter.type   = type;
    const movies = await Movie.find(filter).sort(sort);
    res.json({ success: true, count: movies.length, movies });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET stats
router.get("/stats", async (req, res) => {
  try {
    const uid = req.user._id;
    const [total, watched, watchlist, watching, genreStats, ratingStats, tvCount, movieCount] = await Promise.all([
      Movie.countDocuments({ user: uid }),
      Movie.countDocuments({ user: uid, status: "watched" }),
      Movie.countDocuments({ user: uid, status: "watchlist" }),
      Movie.countDocuments({ user: uid, status: "watching" }),
      Movie.aggregate([{ $match: { user: uid, status: "watched" } }, { $group: { _id: "$genre", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Movie.aggregate([{ $match: { user: uid, status: "watched", rating: { $gt: 0 } } }, { $group: { _id: null, avgRating: { $avg: "$rating" } } }]),
      Movie.countDocuments({ user: uid, type: "tv" }),
      Movie.countDocuments({ user: uid, type: "movie" }),
    ]);
    res.json({ success: true, stats: { total, watched, watchlist, watching, tvCount, movieCount, avgRating: ratingStats[0]?.avgRating?.toFixed(1) || 0, topGenre: genreStats[0]?._id || "—", genreBreakdown: genreStats } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET one
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findOne({ _id: req.params.id, user: req.user._id });
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, movie });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST add
router.post("/", movieValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("[POST /movies] Validation failed:", errors.array(), "Body:", req.body);
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join("; "),
      errors: errors.array(),
    });
  }
  try {
    const { tmdbId, title, type, year, genre, poster, overview, status, rating, review, totalSeasons, totalEpisodes, watchedEpisodes, currentSeason, watchedEpisodeIds } = req.body;
    if (tmdbId) {
      const exists = await Movie.findOne({ user: req.user._id, tmdbId, type: type || "movie" });
      if (exists) return res.status(400).json({ success: false, message: "Already in your list!" });
    }
    const movie = await Movie.create({ user: req.user._id, tmdbId, title, type: type || "movie", year, genre, poster, overview, status: status || "watchlist", rating: rating || 0, review: review || "", totalSeasons, totalEpisodes, watchedEpisodes: watchedEpisodes || 0, currentSeason: currentSeason || 1, watchedEpisodeIds: watchedEpisodeIds || [] });
    res.status(201).json({ success: true, movie });
  } catch (e) {
    console.error("[POST /movies] Error:", e.message, "Body:", req.body);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT update
router.put("/:id", movieValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("[PUT /movies/:id] Validation failed:", errors.array(), "Body:", req.body);
    return res.status(400).json({
      success: false,
      message: errors.array().map(e => e.msg).join("; "),
      errors: errors.array(),
    });
  }
  try {
    const movie = await Movie.findOne({ _id: req.params.id, user: req.user._id });
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });
    const fields = ["status","rating","review","genre","watchedEpisodes","currentSeason","totalSeasons","totalEpisodes","watchedEpisodeIds"];
    fields.forEach(f => { if (req.body[f] !== undefined) movie[f] = req.body[f]; });
    await movie.save();
    res.json({ success: true, movie });
  } catch (e) {
    console.error("[PUT /movies/:id] Error:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH toggle single episode watched state
router.patch("/:id/episode", async (req, res) => {
  try {
    const { episodeKey, watched } = req.body; // e.g. { episodeKey: "S2E5", watched: true }
    if (!episodeKey) return res.status(400).json({ success: false, message: "episodeKey required" });
    const movie = await Movie.findOne({ _id: req.params.id, user: req.user._id });
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });
    const ids = new Set(movie.watchedEpisodeIds || []);
    watched ? ids.add(episodeKey) : ids.delete(episodeKey);
    movie.watchedEpisodeIds = [...ids];
    movie.watchedEpisodes   = ids.size;
    await movie.save();
    res.json({ success: true, movie });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const movie = await Movie.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Removed" });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
