import { useState, useEffect, useRef } from "react";
import { useMovies } from "../context/MovieContext";
import { tmdb, posterUrl, profileUrl, backdropUrl } from "../utils/tmdb";
import StarRating from "./StarRating";
import ActorDetailPopup from "./ActorDetailPopup";

// ── Horizontal scrolling carousel ─────────────────────────────
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

// ── Section title ──────────────────────────────────────────────
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

// ── Stat pill ─────────────────────────────────────────────────
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

// ── MAIN COMPONENT ─────────────────────────────────────────────
export default function MovieDetailPopup({ item, onClose, onOpenMovie }) {
  const { addMovie, movies, updateMovie } = useMovies();

  // UI state
  const [details,     setDetails]     = useState(null);
  const [cast,        setCast]        = useState([]);
  const [similar,     setSimilar]     = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading,     setLoading]     = useState(true);

  // User state
  const [status,          setStatus]          = useState("watchlist");
  const [rating,          setRating]          = useState(0);
  const [saving,          setSaving]          = useState(false);
  const [saved,           setSaved]           = useState(false);   // flash feedback
  const [selectedActorId, setSelectedActorId] = useState(null);

  const tmdbId   = item.id || item.tmdbId;
  const title    = item.title || item.name || "";
  const year     = item.release_date?.split("-")[0] || item.year || "";
  const existing = movies.find(m => (m.tmdbId === tmdbId || (item._id && m._id === item._id)) && (m.type === "movie" || !m.type));

  // Initialise from existing library entry
  useEffect(() => {
    if (existing) {
      setStatus(existing.status || "watchlist");
      setRating(existing.rating || 0);
    }
  }, [existing]);

  // Fetch details + credits + similar + recommended in parallel
  useEffect(() => {
    if (!tmdbId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      tmdb(`/movie/${tmdbId}`, { append_to_response: "credits" }),
      tmdb(`/movie/${tmdbId}/similar`),
      tmdb(`/movie/${tmdbId}/recommendations`),
    ]).then(([det, sim, rec]) => {
      setDetails(det);
      setCast((det?.credits?.cast || []).slice(0, 10));
      setSimilar((sim?.results || []).filter(m => m.poster_path).slice(0, 20));
      setRecommended((rec?.results || []).filter(m => m.poster_path).slice(0, 20));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tmdbId]);

  // ── Save handler (immediate on button click) ─────────────────
  const handleSave = async (newStatus) => {
    const s = newStatus ?? status;
    setSaving(true);
    try {
      if (existing) {
        await updateMovie(existing._id, { status: s, rating });
      } else {
        await addMovie({
          tmdbId:   tmdbId,
          title:    title || details?.title || "",
          type:     "movie",
          year:     year || details?.release_date?.split("-")[0] || "",
          poster:   item.poster_path ? posterUrl(item.poster_path) : item.poster || (details?.poster_path ? posterUrl(details.poster_path) : ""),
          overview: item.overview || details?.overview || "",
          genre:    (details?.genres?.[0]?.name) || item.genre || "Other",
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

  // Derived display values (prefer fetched details)
  const d         = details || item;
  const runtime   = details?.runtime;
  const tmdbScore = (d.vote_average || 0).toFixed(1);
  const voteCount = details?.vote_count?.toLocaleString() || "—";
  const popularity= details?.popularity?.toFixed(0) || "—";
  const genres    = details?.genres?.map(g => g.name) || [];
  const overview  = d.overview || "";
  const backdrop  = d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : null;
  const poster    = d.poster_path   ? posterUrl(d.poster_path, "w342") : null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ alignItems: "flex-start", padding: "32px 16px", overflowY: "auto" }}
    >
      {/* ── MODAL SHELL ── */}
      <div
        className="mdp-shell"
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 860,
          margin: "0 auto",
          background: "#141414",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
          animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          position: "relative",
        }}
      >

        {/* ══ BACKDROP HERO ══════════════════════════════════════ */}
        <div style={{ position: "relative", height: 340, overflow: "hidden" }}>
          {backdrop ? (
            <img
              src={backdrop}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem",
            }}>🎬</div>
          )}

          {/* Cinematic gradient overlays */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.3) 55%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(20,20,20,0.7) 0%, transparent 60%)" }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", fontSize: "1rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)", transition: "all 0.2s",
            }}
          >✕</button>

          {/* TMDb score badge */}
          {tmdbScore && (
            <div style={{
              position: "absolute", top: 16, left: 16,
              background: "rgba(0,0,0,0.75)",
              border: "1.5px solid rgba(236,72,153,0.5)",
              borderRadius: 8, padding: "4px 10px",
              backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ color: "#FBBF24", fontSize: "0.82rem" }}>⭐</span>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>{tmdbScore}</span>
              <span style={{ color: "var(--text3)", fontSize: "0.72rem" }}>/10</span>
            </div>
          )}
        </div>

        {/* ══ POSTER + HEADER ════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 24, padding: "0 28px", marginTop: -80, position: "relative", zIndex: 2 }}>
          {/* Poster */}
          {poster ? (
            <img
              src={poster}
              alt={title}
              style={{
                width: 130, height: 195, objectFit: "cover", borderRadius: 12,
                border: "3px solid rgba(255,255,255,0.1)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: 130, height: 195, borderRadius: 12, background: "var(--bg3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem",
              border: "3px solid rgba(255,255,255,0.1)", flexShrink: 0,
            }}>🎬</div>
          )}

          {/* Title block */}
          <div style={{ flex: 1, paddingTop: 90, minWidth: 0 }}>
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.4rem", letterSpacing: "2px",
              color: "#fff", lineHeight: 1, marginBottom: 8,
            }}>{title}</h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
              {year && (
                <span style={{ fontSize: "0.82rem", color: "var(--text2)", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
                  {year}
                </span>
              )}
              {runtime && (
                <span style={{ fontSize: "0.82rem", color: "var(--text2)", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>
                  🕐 {Math.floor(runtime / 60)}h {runtime % 60}m
                </span>
              )}
              {genres.slice(0, 3).map(g => (
                <span key={g} style={{
                  fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)",
                  background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.25)",
                  padding: "3px 10px", borderRadius: 20,
                }}>{g}</span>
              ))}
            </div>

            {/* Watchlist / Watched buttons — immediate save */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                disabled={saving}
                onClick={() => { setStatus("watchlist"); handleSave("watchlist"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 10, fontSize: "0.83rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  background: status === "watchlist"
                    ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.06)",
                  border: status === "watchlist"
                    ? "1.5px solid rgba(59,130,246,0.55)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watchlist" ? "#60A5FA" : "var(--text2)",
                }}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                </svg>
                {saving && status === "watchlist" ? "Saving…" : "Watchlist"}
              </button>

              <button
                disabled={saving}
                onClick={() => { setStatus("watched"); handleSave("watched"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 10, fontSize: "0.83rem", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  background: status === "watched"
                    ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.06)",
                  border: status === "watched"
                    ? "1.5px solid rgba(16,185,129,0.55)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watched" ? "#34D399" : "var(--text2)",
                }}
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {saving && status === "watched" ? "Saving…" : "Watched"}
              </button>

              {/* Saved flash */}
              {saved && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: "0.8rem", color: "#34D399", fontWeight: 600,
                  animation: "fadeIn 0.2s",
                }}>✓ Saved!</span>
              )}
            </div>
          </div>
        </div>

        {/* ══ BODY ═══════════════════════════════════════════════ */}
        <div style={{ padding: "24px 28px 32px", display: "flex", flexDirection: "column", gap: 32 }}>

          {/* ── Overview ── */}
          {overview && (
            <div>
              <SectionTitle>Overview</SectionTitle>
              <p style={{ fontSize: "0.9rem", color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>
                {overview}
              </p>
            </div>
          )}

          {/* ── Ratings ── */}
          <div>
            <SectionTitle>Ratings &amp; Stats</SectionTitle>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatPill label="TMDb Rating" value={`⭐ ${tmdbScore}`} highlight="#FBBF24" />
              <StatPill label="Vote Count"  value={voteCount}           highlight="var(--blue)" />
              <StatPill label="Popularity"  value={popularity}          highlight="var(--accent)" />
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "12px 16px",
                flex: 1, minWidth: 0, textAlign: "center",
              }}>
                <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}>
                  <StarRating value={rating} onChange={r => { setRating(r); }} size="sm" />
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                  Your Rating
                </div>
              </div>
            </div>
          </div>

          {/* ── Cast ── */}
          {(loading || cast.length > 0) && (
            <div>
              <SectionTitle>Cast</SectionTitle>
              {loading ? (
                <div style={{ display: "flex", gap: 12 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      width: 90, flexShrink: 0, display: "flex", flexDirection: "column", gap: 6,
                    }}>
                      <div style={{
                        width: 90, height: 90, borderRadius: "50%",
                        background: "linear-gradient(135deg, #1A1A1A, #2A2A2A)",
                        animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%",
                      }} />
                      <div style={{ height: 10, borderRadius: 4, background: "#1A1A1A", animation: "shimmer 1.5s infinite" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <HorizontalScroll>
                  {cast.map(person => (
                    <div
                      key={person.id}
                      onClick={() => setSelectedActorId(person.id)}
                      style={{
                        flexShrink: 0, width: 90,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                        scrollSnapAlign: "start", cursor: "pointer",
                        transition: "transform 0.2s",
                      }}
                      title={`View ${person.name}`}
                    >
                      {profileUrl(person.profile_path) ? (
                        <img
                          src={profileUrl(person.profile_path)}
                          alt={person.name}
                          style={{
                            width: 80, height: 80, borderRadius: "50%",
                            objectFit: "cover", border: "2px solid rgba(255,255,255,0.12)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            transition: "border-color 0.2s",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 80, height: 80, borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--bg3), var(--bg4))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.8rem", border: "2px solid rgba(255,255,255,0.08)",
                        }}>👤</div>
                      )}
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 2 }}>
                          {person.name}
                        </div>
                        <div style={{ fontSize: "0.65rem", color: "var(--text3)", lineHeight: 1.3 }}>
                          {person.character || "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </HorizontalScroll>
              )}
            </div>
          )}

          {/* ── Similar Movies ── */}
          {(loading || similar.length > 0) && (
            <div>
              <SectionTitle>Similar Movies</SectionTitle>
              {loading ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="row-card-skeleton" style={{ animationDelay: `${i * 0.06}s` }} />
                  ))}
                </div>
              ) : (
                <HorizontalScroll>
                  {similar.map(movie => (
                    <div
                      key={movie.id}
                      style={{ flexShrink: 0, width: 120, scrollSnapAlign: "start", cursor: "pointer" }}
                      onClick={() => onOpenMovie && onOpenMovie(movie)}
                    >
                      <div style={{ position: "relative", width: 120, height: 180, borderRadius: 9, overflow: "hidden", marginBottom: 7, background: "var(--bg3)", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}>
                        {movie.poster_path ? (
                          <img
                            src={posterUrl(movie.poster_path, "w185")}
                            alt={movie.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                            className="mdp-poster-hover"
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎬</div>
                        )}
                        <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(0,0,0,0.75)", borderRadius: 5, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                          ⭐ {movie.vote_average?.toFixed(1)}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {movie.title}
                      </div>
                    </div>
                  ))}
                </HorizontalScroll>
              )}
            </div>
          )}

          {/* ── Recommended ── */}
          {(loading || recommended.length > 0) && (
            <div>
              <SectionTitle>Recommended For You</SectionTitle>
              {loading ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="row-card-skeleton" style={{ animationDelay: `${i * 0.06}s` }} />
                  ))}
                </div>
              ) : (
                <HorizontalScroll>
                  {recommended.map(movie => (
                    <div
                      key={movie.id}
                      style={{ flexShrink: 0, width: 120, scrollSnapAlign: "start", cursor: "pointer" }}
                      onClick={() => onOpenMovie && onOpenMovie(movie)}
                    >
                      <div style={{ position: "relative", width: 120, height: 180, borderRadius: 9, overflow: "hidden", marginBottom: 7, background: "var(--bg3)", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}>
                        {movie.poster_path ? (
                          <img
                            src={posterUrl(movie.poster_path, "w185")}
                            alt={movie.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎬</div>
                        )}
                        <div style={{ position: "absolute", bottom: 5, left: 5, background: "rgba(0,0,0,0.75)", borderRadius: 5, padding: "2px 6px", fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>
                          ⭐ {movie.vote_average?.toFixed(1)}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.73rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {movie.title}
                      </div>
                    </div>
                  ))}
                </HorizontalScroll>
              )}
            </div>
          )}
        </div>

      </div>

      {selectedActorId && (
        <ActorDetailPopup
          actorId={selectedActorId}
          onClose={() => setSelectedActorId(null)}
          onOpenMovie={m => onOpenMovie ? onOpenMovie(m) : null}
        />
      )}
    </div>
  );
}
