const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tmdbId:   { type: Number, default: null },
    title:    { type: String, required: [true, "Title is required"], trim: true, maxlength: 200 },
    type:     { type: String, enum: ["movie", "tv"], default: "movie" },
    year:     { type: String, default: "" },
    genre:    {
      type: String,
      enum: [
        // Core genres (original)
        "Action","Animation","Comedy","Crime","Documentary","Drama",
        "Fantasy","Horror","Romance","Sci-Fi","Thriller","Other",
        // Extended — covers all TMDb movie + TV genre names
        "Adventure","Family","History","Music","Mystery",
        "Science Fiction","TV Movie","War","Western",
        "Sci-Fi & Fantasy","Action & Adventure",
        "Kids","News","Reality","Soap","Talk","War & Politics",
      ],
      default: "Other",
    },
    poster:   { type: String, default: "" },
    overview: { type: String, default: "", maxlength: 1000 },
    status:   { type: String, enum: ["watchlist", "watched", "watching"], default: "watchlist" },
    rating:   { type: Number, min: 0, max: 5, default: 0 },
    review:   { type: String, default: "", maxlength: 2000 },
    // TV Show specific
    totalSeasons:      { type: Number, default: null },
    totalEpisodes:     { type: Number, default: null },
    watchedEpisodes:   { type: Number, default: 0 },
    currentSeason:     { type: Number, default: 1 },
    // Per-episode tracking: array of keys like "S1E3", "S2E7"
    watchedEpisodeIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

movieSchema.index({ user: 1, tmdbId: 1, type: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Movie", movieSchema);
