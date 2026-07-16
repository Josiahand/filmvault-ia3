import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMovies } from "../context/MovieContext";
import { tmdb, posterUrl, profileUrl, backdropUrl } from "../utils/tmdb";
import StarRating from "../components/StarRating";

function HorizontalScroll({ children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 600, behavior: "smooth" });
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => scroll(-1)}
        style={{
          position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, width: 32, height: 32, borderRadius: "50%",
          background: "rgba(30,30,30,0.95)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontSize: "1.1rem", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >‹</button>
      <div
        ref={ref}
        style={{
          display: "flex", gap: 12, overflowX: "auto",
          paddingBottom: 6, scrollSnapType: "x mandatory",
        }}
        className="mdp-scroll"
      >
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        style={{
          position: "absolute", right: -16, top: "50%", transform: "translateY(-50%)",
          zIndex: 10, width: 32, height: 32, borderRadius: "50%",
          background: "rgba(30,30,30,0.95)", border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff", fontSize: "1.1rem", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >›</button>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: "1rem", fontWeight: 700, color: "#fff",
      marginBottom: 16, letterSpacing: "0.2px",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ width: 3, height: 18, borderRadius: 2, background: "var(--grad)", display: "inline-block" }} />
      {children}
    </div>
  );
}

function StatPill({ label, value, highlight }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "12px 16px",
      flex: 1, minWidth: 0,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: highlight || "#fff", marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: "0.68rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export default function MovieDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMovie, movies, updateMovie } = useMovies();

  const [details, setDetails]         = useState(null);
  const [cast, setCast]               = useState([]);
  const [similar, setSimilar]         = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading]         = useState(true);

  const [status, setStatus] = useState("watchlist");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const numericId = Number(id);
  const existing = movies.find(m => (m.tmdbId === numericId || (m._id === id)) && (m.type === "movie" || !m.type));

  useEffect(() => {
    if (existing) {
      setStatus(existing.status || "watchlist");
      setRating(existing.rating || 0);
    }
  }, [existing]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    window.scrollTo(0, 0);

    Promise.all([
      tmdb(`/movie/${id}`, { append_to_response: "credits" }),
      tmdb(`/movie/${id}/similar`),
      tmdb(`/movie/${id}/recommendations`),
    ]).then(([det, sim, rec]) => {
      setDetails(det);
      setCast((det?.credits?.cast || []).slice(0, 15));
      setSimilar((sim?.results || []).filter(m => m.poster_path).slice(0, 20));
      setRecommended((rec?.results || []).filter(m => m.poster_path).slice(0, 20));
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to fetch movie details:", err);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (newStatus) => {
    const s = newStatus ?? status;
    setSaving(true);
    try {
      if (existing) {
        await updateMovie(existing._id, { status: s, rating });
      } else {
        await addMovie({
          tmdbId:   numericId || details?.id,
          title:    details?.title || "",
          type:     "movie",
          year:     details?.release_date?.split("-")[0] || "",
          poster:   details?.poster_path ? posterUrl(details.poster_path) : "",
          overview: details?.overview || "",
          genre:    (details?.genres?.[0]?.name) || "Other",
          status:   s,
          rating,
          review:   "",
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page-body" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3, margin: "0 auto 16px" }} />
        <div style={{ color: "var(--text2)", fontSize: "0.95rem" }}>Loading movie details…</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="page-body" style={{ padding: "60px 24px", textAlign: "center" }}>
        <h3>Movie not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const backdrop   = backdropUrl(details.backdrop_path);
  const poster     = posterUrl(details.poster_path, "w500");
  const year       = details.release_date?.split("-")[0] || "";
  const runtime    = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : null;
  const tmdbScore  = details.vote_average ? details.vote_average.toFixed(1) : null;
  const voteCount  = details.vote_count ? details.vote_count.toLocaleString() : "—";
  const popularity = details.popularity ? Math.round(details.popularity) : "—";
  const genres     = details.genres || [];

  return (
    <div className="page-body" style={{ padding: "0 0 60px" }}>
      {/* ── BACK BUTTON & BANNER HEADER ───────────────────── */}
      <div style={{ position: "relative", minHeight: 420, overflow: "hidden", background: "#07090D" }}>
        {backdrop ? (
          <img
            src={backdrop}
            alt={details.title}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 20%", opacity: 0.35,
              filter: "blur(2px)", transform: "scale(1.04)",
            }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #121824, #07090D)" }} />
        )}

        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,9,13,0.3) 0%, rgba(7,9,13,0.85) 65%, #07090D 100%)",
        }} />

        {/* Floating Controls */}
        <div style={{ position: "absolute", top: 20, left: 24, zIndex: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", padding: "8px 16px", borderRadius: 20, fontSize: "0.85rem",
              fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              backdropFilter: "blur(8px)",
            }}
          >
            ← Back
          </button>
        </div>

        {/* Hero Card Content */}
        <div style={{
          position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto",
          padding: "80px 24px 32px", display: "flex", gap: 32, alignItems: "flex-end",
          flexWrap: "wrap",
        }}>
          {/* Poster */}
          <div style={{ flexShrink: 0 }}>
            {poster ? (
              <img
                src={poster}
                alt={details.title}
                style={{
                  width: 190, height: 285, borderRadius: 16, objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
                }}
              />
            ) : (
              <div style={{
                width: 190, height: 285, borderRadius: 16, background: "var(--bg3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem",
              }}>🎬</div>
            )}
          </div>

          {/* Details Metadata */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {tmdbScore && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)",
                color: "#FBBF24", fontWeight: 800, fontSize: "0.85rem",
                padding: "4px 12px", borderRadius: 20, marginBottom: 12,
              }}>
                ⭐ {tmdbScore} <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>/10</span>
              </span>
            )}

            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: "3.2rem",
              letterSpacing: "1.5px", margin: "0 0 10px", lineHeight: 1, color: "#fff",
            }}>
              {details.title}
            </h1>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: "0.88rem", color: "var(--text2)" }}>
              {year && <span>{year}</span>}
              {runtime && <span>⏱️ {runtime}</span>}
              {genres.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {genres.map(g => (
                    <span key={g.id} style={{
                      background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text)",
                    }}>{g.name}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Watchlist & Watched Toggle Buttons */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20 }}>
              <button
                disabled={saving}
                onClick={() => { setStatus("watchlist"); handleSave("watchlist"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 22px", borderRadius: 12, fontSize: "0.88rem", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                  background: status === "watchlist" ? "var(--grad)" : "rgba(255,255,255,0.08)",
                  border: "none", color: status === "watchlist" ? "#000" : "#fff",
                }}
              >
                {saving && status === "watchlist" ? "Saving…" : "📌 Watchlist"}
              </button>

              <button
                disabled={saving}
                onClick={() => { setStatus("watched"); handleSave("watched"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 22px", borderRadius: 12, fontSize: "0.88rem", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                  background: status === "watched" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)",
                  border: status === "watched" ? "1.5px solid rgba(16,185,129,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watched" ? "#34D399" : "var(--text2)",
                }}
              >
                {saving && status === "watched" ? "Saving…" : "✅ Watched"}
              </button>

              {saved && <span style={{ fontSize: "0.85rem", color: "#34D399", fontWeight: 700 }}>✓ Saved!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY SECTIONS ─────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "32px auto 0", padding: "0 24px", display: "flex", flexDirection: "column", gap: 36 }}>
        {/* Overview */}
        {details.overview && (
          <div>
            <SectionTitle>Overview</SectionTitle>
            <p style={{ fontSize: "0.95rem", color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>
              {details.overview}
            </p>
          </div>
        )}

        {/* Ratings & Stats */}
        <div>
          <SectionTitle>Ratings & Stats</SectionTitle>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <StatPill label="TMDb Rating" value={`⭐ ${tmdbScore || "—"}`} highlight="#FBBF24" />
            <StatPill label="Vote Count"  value={voteCount}          highlight="var(--blue)" />
            <StatPill label="Popularity"  value={popularity}         highlight="var(--accent)" />
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 0, textAlign: "center",
            }}>
              <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}>
                <StarRating value={rating} onChange={r => { setRating(r); if (existing) updateMovie(existing._id, { rating: r }); }} size="sm" />
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                Your Rating
              </div>
            </div>
          </div>
        </div>

        {/* Cast Section */}
        {cast.length > 0 && (
          <div>
            <SectionTitle>Cast</SectionTitle>
            <HorizontalScroll>
              {cast.map(person => (
                <div
                  key={person.id}
                  onClick={() => navigate(`/person/${person.id}`)}
                  style={{
                    flexShrink: 0, width: 95, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 8, scrollSnapAlign: "start", cursor: "pointer",
                  }}
                  title={`View ${person.name}`}
                >
                  {profileUrl(person.profile_path) ? (
                    <img
                      src={profileUrl(person.profile_path)}
                      alt={person.name}
                      style={{
                        width: 84, height: 84, borderRadius: "50%", objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 84, height: 84, borderRadius: "50%", background: "var(--bg3)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem",
                    }}>👤</div>
                  )}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{person.name}</div>
                    <div style={{ fontSize: "0.65rem", color: "var(--text3)", lineHeight: 1.3 }}>{person.character || "—"}</div>
                  </div>
                </div>
              ))}
            </HorizontalScroll>
          </div>
        )}

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div>
            <SectionTitle>Similar Movies</SectionTitle>
            <HorizontalScroll>
              {similar.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  style={{ flexShrink: 0, width: 130, scrollSnapAlign: "start", cursor: "pointer" }}
                >
                  <div style={{
                    position: "relative", width: 130, height: 195, borderRadius: 12,
                    overflow: "hidden", background: "var(--bg3)", border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 8,
                  }}>
                    <img src={posterUrl(movie.poster_path, "w342")} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.8)", borderRadius: 6, padding: "2px 6px", fontSize: "0.68rem", fontWeight: 700, color: "#FBBF24" }}>
                      ⭐ {movie.vote_average?.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {movie.title}
                  </div>
                </div>
              ))}
            </HorizontalScroll>
          </div>
        )}

        {/* Recommended Movies */}
        {recommended.length > 0 && (
          <div>
            <SectionTitle>Recommended For You</SectionTitle>
            <HorizontalScroll>
              {recommended.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  style={{ flexShrink: 0, width: 130, scrollSnapAlign: "start", cursor: "pointer" }}
                >
                  <div style={{
                    position: "relative", width: 130, height: 195, borderRadius: 12,
                    overflow: "hidden", background: "var(--bg3)", border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 8,
                  }}>
                    <img src={posterUrl(movie.poster_path, "w342")} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.8)", borderRadius: 6, padding: "2px 6px", fontSize: "0.68rem", fontWeight: 700, color: "#FBBF24" }}>
                      ⭐ {movie.vote_average?.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {movie.title}
                  </div>
                </div>
              ))}
            </HorizontalScroll>
          </div>
        )}
      </div>
    </div>
  );
}
