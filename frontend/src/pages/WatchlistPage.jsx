import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "../context/MovieContext";
import { posterUrl } from "../utils/tmdb";

export default function WatchlistPage() {
  const { movies, loading } = useMovies();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all"); // "all" | "movie" | "tv"
  const [sortBy, setSortBy]       = useState("recent"); // "recent" | "title" | "rating" | "year"

  // Raw watchlist items
  const rawWatchlist = useMemo(() => {
    return movies.filter((m) => m.status === "watchlist");
  }, [movies]);

  // Filtered and sorted items
  const watchlist = useMemo(() => {
    let list = [...rawWatchlist];

    // Category Filter
    if (activeTab === "movie") {
      list = list.filter((m) => m.type === "movie" || !m.type);
    } else if (activeTab === "tv") {
      list = list.filter((m) => m.type === "tv");
    }

    // Sorting Logic
    list.sort((a, b) => {
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "rating") {
        return (b.rating || b.vote_average || 0) - (a.rating || a.vote_average || 0);
      }
      if (sortBy === "year") {
        return String(b.year || "").localeCompare(String(a.year || ""));
      }
      // Default: "recent" (preserve MongoDB array order or createdAt)
      return 0;
    });

    return list;
  }, [rawWatchlist, activeTab, sortBy]);

  const movieCount = useMemo(() => rawWatchlist.filter(m => m.type === "movie" || !m.type).length, [rawWatchlist]);
  const tvCount    = useMemo(() => rawWatchlist.filter(m => m.type === "tv").length, [rawWatchlist]);

  const handleCardClick = (item) => {
    const targetId = item.tmdbId || item.id || item._id;
    if (item.type === "tv") {
      navigate(`/tv/${targetId}`);
    } else {
      navigate(`/movie/${targetId}`);
    }
  };

  return (
    <div className="page-body" style={{ padding: "32px 32px 60px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2.8rem",
            letterSpacing: "1px",
            margin: "0 0 6px",
            color: "#fff",
          }}
        >
          My <span style={{ color: "var(--accent)" }}>Watchlist</span>
        </h1>
        <div style={{ fontSize: "0.92rem", color: "var(--text2)" }}>
          {rawWatchlist.length} title{rawWatchlist.length !== 1 ? "s" : ""} saved to watch later
        </div>
      </div>

      {/* Filter Tabs & Sort Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Category Filter Tabs */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: 24,
            padding: 4,
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {[
            { id: "all", label: `All (${rawWatchlist.length})` },
            { id: "movie", label: `Movies (${movieCount})` },
            { id: "tv", label: `TV Shows (${tvCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? "var(--grad)" : "transparent",
                color: activeTab === tab.id ? "#000" : "var(--text2)",
                border: "none",
                borderRadius: 20,
                padding: "6px 18px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text3)", fontWeight: 600 }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 20,
              padding: "7px 16px",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="recent" style={{ background: "#0D1117" }}>Recently Added</option>
            <option value="title" style={{ background: "#0D1117" }}>Alphabetical (A-Z)</option>
            <option value="rating" style={{ background: "#0D1117" }}>Rating</option>
            <option value="year" style={{ background: "#0D1117" }}>Release Date</option>
          </select>
        </div>
      </div>

      {/* Grid Content or Empty State */}
      {loading ? (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: "0 auto 16px" }} />
          <div style={{ color: "var(--text2)", fontSize: "0.9rem" }}>Loading your watchlist…</div>
        </div>
      ) : watchlist.length === 0 ? (
        /* Empty State */
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: 20,
            maxWidth: 540,
            margin: "40px auto 0",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: 16, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}>
            📌
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            Your Watchlist is empty.
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text3)", margin: 0, lineHeight: 1.6 }}>
            Start adding movies and TV shows to watch later.
          </p>
        </div>
      ) : (
        /* Clean Poster Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 24,
          }}
        >
          {watchlist.map((item) => {
            const isTV    = item.type === "tv";
            const poster  = posterUrl(item.poster, "w500");
            const score   = item.rating > 0 ? item.rating : item.vote_average ? item.vote_average.toFixed(1) : null;

            return (
              <div
                key={item._id || item.id}
                onClick={() => handleCardClick(item)}
                className="watchlist-poster-card"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {/* Poster Wrap */}
                <div
                  className="watchlist-poster-wrap"
                  style={{
                    position: "relative",
                    width: "100%",
                    paddingTop: "150%",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "var(--bg3)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.5)",
                    marginBottom: 10,
                    transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  }}
                >
                  {poster ? (
                    <img
                      src={poster}
                      alt={item.title}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "3rem",
                        background: "linear-gradient(135deg, var(--bg3), var(--bg4))",
                      }}
                    >
                      {isTV ? "📺" : "🎬"}
                    </div>
                  )}

                  {/* Rating Badge (Optional) */}
                  {score && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0, 0, 0, 0.78)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 8,
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#FBBF24",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      ⭐ {score}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: 2,
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text3)" }}>
                    {item.year || "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
