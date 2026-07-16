import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMovies } from "../context/MovieContext";
import { tmdb, posterUrl, profileUrl, stillUrl, backdropUrl } from "../utils/tmdb";
import StarRating from "../components/StarRating";

const epKey = (season, ep) => `S${season}E${ep}`;

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
      flex: 1, minWidth: 0, textAlign: "center",
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

export default function TVDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addMovie, movies, updateMovie } = useMovies();

  const [details, setDetails]         = useState(null);
  const [cast, setCast]               = useState([]);
  const [similar, setSimilar]         = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [seasonData, setSeasonData]   = useState(null);
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);

  const [status, setStatus]   = useState("watchlist");
  const [rating, setRating]   = useState(0);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  const [watchedSet, setWatchedSet] = useState(new Set());
  const [toggling, setToggling]     = useState({});

  const numericId = Number(id);
  const existing = movies.find(m => (m.tmdbId === numericId || (m._id === id)) && m.type === "tv");

  useEffect(() => {
    if (existing) {
      setStatus(existing.status || "watchlist");
      setRating(existing.rating || 0);
      setWatchedSet(new Set(existing.watchedEpisodeIds || []));
    }
  }, [existing]);

  useEffect(() => {
    if (!id) return;
    setLoadingMain(true);
    window.scrollTo(0, 0);

    Promise.all([
      tmdb(`/tv/${id}`, { append_to_response: "credits,next_episode_to_air,last_episode_to_air" }),
      tmdb(`/tv/${id}/similar`),
      tmdb(`/tv/${id}/recommendations`),
    ]).then(([det, sim, rec]) => {
      setDetails(det);
      setCast((det?.credits?.cast || []).slice(0, 15));
      setSimilar((sim?.results || []).filter(s => s.poster_path).slice(0, 20));
      setRecommended((rec?.results || []).filter(s => s.poster_path).slice(0, 20));
      const firstSeason = det?.seasons?.find(s => s.season_number > 0)?.season_number || 1;
      setActiveSeason(firstSeason);
      setLoadingMain(false);
    }).catch((err) => {
      console.error("Failed to fetch TV details:", err);
      setLoadingMain(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !activeSeason) return;
    setLoadingSeason(true);
    setSeasonData(null);
    tmdb(`/tv/${id}/season/${activeSeason}`).then(data => {
      setSeasonData(data);
      setLoadingSeason(false);
    }).catch(() => setLoadingSeason(false));
  }, [id, activeSeason]);

  const ensureEntry = async () => {
    if (existing) return existing;
    const genres = details?.genres || [];
    return await addMovie({
      tmdbId:        numericId || details?.id,
      title:         details?.name || "",
      type:          "tv",
      year:          details?.first_air_date?.split("-")[0] || "",
      poster:        details?.poster_path ? posterUrl(details.poster_path) : "",
      overview:      details?.overview || "",
      genre:         genres[0]?.name || "Other",
      status:        "watching",
      rating:        0,
      review:        "",
      totalSeasons:  details?.number_of_seasons || null,
      totalEpisodes: details?.number_of_episodes || null,
      watchedEpisodes: 0,
      currentSeason: 1,
      watchedEpisodeIds: [],
    });
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      const entry = await ensureEntry();
      await updateMovie(entry._id, { status: newStatus, rating });
      setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}
    setSaving(false);
  };

  const handleToggleEpisode = async (seasonNum, epNum) => {
    const key = epKey(seasonNum, epNum);
    setToggling(prev => ({ ...prev, [key]: true }));

    const nextSet = new Set(watchedSet);
    if (nextSet.has(key)) {
      nextSet.delete(key);
    } else {
      nextSet.add(key);
    }
    setWatchedSet(nextSet);

    try {
      const entry = await ensureEntry();
      const ids = Array.from(nextSet);
      await updateMovie(entry._id, {
        watchedEpisodeIds: ids,
        watchedEpisodes: ids.length,
        status: ids.length > 0 ? (status === "watchlist" ? "watching" : status) : status,
        currentSeason: seasonNum,
      });
      if (status === "watchlist" && ids.length > 0) setStatus("watching");
    } catch (_) {
      setWatchedSet(new Set(watchedSet));
    }
    setToggling(prev => ({ ...prev, [key]: false }));
  };

  const handleBulkSeason = async (markWatched) => {
    if (!seasonData?.episodes) return;
    const nextSet = new Set(watchedSet);
    seasonData.episodes.forEach(ep => {
      const k = epKey(activeSeason, ep.episode_number);
      if (markWatched) nextSet.add(k);
      else nextSet.delete(k);
    });
    setWatchedSet(nextSet);

    try {
      const entry = await ensureEntry();
      const ids = Array.from(nextSet);
      await updateMovie(entry._id, {
        watchedEpisodeIds: ids,
        watchedEpisodes: ids.length,
        status: ids.length > 0 ? (status === "watchlist" ? "watching" : status) : status,
      });
      if (status === "watchlist" && ids.length > 0) setStatus("watching");
    } catch (_) {}
  };

  if (loadingMain) {
    return (
      <div className="page-body" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3, margin: "0 auto 16px" }} />
        <div style={{ color: "var(--text2)", fontSize: "0.95rem" }}>Loading TV show details…</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="page-body" style={{ padding: "60px 24px", textAlign: "center" }}>
        <h3>TV show not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const backdrop    = backdropUrl(details.backdrop_path);
  const poster      = posterUrl(details.poster_path, "w500");
  const year        = details.first_air_date?.split("-")[0] || "";
  const tmdbScore   = details.vote_average ? details.vote_average.toFixed(1) : null;
  const voteCount   = details.vote_count ? details.vote_count.toLocaleString() : "—";
  const popularity  = details.popularity ? Math.round(details.popularity) : "—";
  const totalEps    = details.number_of_episodes || 0;
  const watchedCount = watchedSet.size;
  const overallPct  = totalEps > 0 ? Math.round((watchedCount / totalEps) * 100) : 0;
  const genres      = details.genres || [];
  const statusLabel = details.status === "Ended" ? "Ended" : details.status === "Canceled" ? "Canceled" : "Running";

  return (
    <div className="page-body" style={{ padding: "0 0 60px" }}>
      {/* ── BANNER HEADER ─────────────────────────────────── */}
      <div style={{ position: "relative", minHeight: 420, overflow: "hidden", background: "#07090D" }}>
        {backdrop ? (
          <img
            src={backdrop}
            alt={details.name}
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

        {/* Back Button */}
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
                alt={details.name}
                style={{
                  width: 190, height: 285, borderRadius: 16, objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 16px 40px rgba(0,0,0,0.8)",
                }}
              />
            ) : (
              <div style={{
                width: 190, height: 285, borderRadius: 16, background: "var(--bg3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem",
              }}>📺</div>
            )}
          </div>

          {/* Metadata */}
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
              {details.name}
            </h1>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: "0.88rem", color: "var(--text2)" }}>
              {year && <span>{year}</span>}
              <span style={{
                background: statusLabel === "Running" ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                color: statusLabel === "Running" ? "#34D399" : "#F87171",
                padding: "2px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 700,
              }}>{statusLabel}</span>
              {details.number_of_seasons && <span>📺 {details.number_of_seasons} season{details.number_of_seasons > 1 ? "s" : ""}</span>}
              {totalEps > 0 && <span>🎬 {totalEps} eps</span>}
            </div>

            {/* Status Buttons */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 20, flexWrap: "wrap" }}>
              <button
                disabled={saving}
                onClick={() => handleStatusChange("watchlist")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 20px", borderRadius: 12, fontSize: "0.88rem", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                  background: status === "watchlist" ? "var(--grad)" : "rgba(255,255,255,0.08)",
                  border: "none", color: status === "watchlist" ? "#000" : "#fff",
                }}
              >
                📌 Watchlist
              </button>

              <button
                disabled={saving}
                onClick={() => handleStatusChange("watching")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 20px", borderRadius: 12, fontSize: "0.88rem", fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s",
                  background: status === "watching" ? "rgba(240,165,0,0.2)" : "rgba(255,255,255,0.08)",
                  border: status === "watching" ? "1.5px solid rgba(240,165,0,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watching" ? "var(--accent)" : "var(--text2)",
                }}
              >
                ▶️ Watching
              </button>

              {saved && <span style={{ fontSize: "0.85rem", color: "#34D399", fontWeight: 700 }}>✓ Saved!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY CONTENT ─────────────────────────────────── */}
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

        {/* Episode Progress & Seasons */}
        <div>
          <SectionTitle>Seasons & Episode Tracking</SectionTitle>

          {totalEps > 0 && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text)" }}>Overall Progress</span>
                <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--accent)" }}>{watchedCount} / {totalEps} eps ({overallPct}%)</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${overallPct}%`, background: "var(--grad)", borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
            </div>
          )}

          {/* Season Selector Tabs */}
          {details.seasons && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 20 }}>
              {details.seasons.filter(s => s.season_number > 0).map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeason(s.season_number)}
                  style={{
                    background: activeSeason === s.season_number ? "var(--accent)" : "rgba(255,255,255,0.06)",
                    color: activeSeason === s.season_number ? "#000" : "var(--text2)",
                    border: "none", borderRadius: 20, padding: "8px 18px", fontSize: "0.85rem",
                    fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
                  }}
                >
                  Season {s.season_number} ({s.episode_count} eps)
                </button>
              ))}
            </div>
          )}

          {/* Bulk Actions */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => handleBulkSeason(true)}
              style={{
                background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)",
                color: "#34D399", padding: "6px 14px", borderRadius: 8, fontSize: "0.78rem",
                fontWeight: 700, cursor: "pointer",
              }}
            >
              ✓ Mark Season {activeSeason} Watched
            </button>
            <button
              onClick={() => handleBulkSeason(false)}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text3)", padding: "6px 14px", borderRadius: 8, fontSize: "0.78rem",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Unmark Season {activeSeason}
            </button>
          </div>

          {/* Episodes List */}
          {loadingSeason ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "var(--text3)" }}>Loading episodes…</div>
          ) : seasonData?.episodes ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {seasonData.episodes.map(ep => {
                const k = epKey(activeSeason, ep.episode_number);
                const isWatched = watchedSet.has(k);
                const isToggling = toggling[k];

                return (
                  <div
                    key={ep.id}
                    onClick={() => handleToggleEpisode(activeSeason, ep.episode_number)}
                    style={{
                      display: "flex", gap: 16, alignItems: "center",
                      background: isWatched ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.03)",
                      border: isWatched ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12, padding: "12px 16px", cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {/* Checkbox button */}
                    <button
                      disabled={isToggling}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: isWatched ? "#34D399" : "transparent",
                        border: isWatched ? "none" : "2px solid rgba(255,255,255,0.2)",
                        color: isWatched ? "#000" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "0.9rem", flexShrink: 0, cursor: "pointer",
                      }}
                    >
                      ✓
                    </button>

                    {/* Thumbnail */}
                    {ep.still_path && (
                      <img
                        src={stillUrl(ep.still_path, "w185")}
                        alt={ep.name}
                        style={{ width: 100, height: 56, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                        loading="lazy"
                      />
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                        E{ep.episode_number} · {ep.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
                        {ep.air_date ? ep.air_date : "TBA"} {ep.runtime ? `· ${ep.runtime}m` : ""}
                      </div>
                      {ep.overview && (
                        <div style={{
                          fontSize: "0.78rem", color: "var(--text2)", marginTop: 4,
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>{ep.overview}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "var(--text3)", fontSize: "0.88rem" }}>No episode data found for Season {activeSeason}.</div>
          )}
        </div>

        {/* Similar TV Shows */}
        {similar.length > 0 && (
          <div>
            <SectionTitle>Similar TV Shows</SectionTitle>
            <HorizontalScroll>
              {similar.map(show => (
                <div
                  key={show.id}
                  onClick={() => navigate(`/tv/${show.id}`)}
                  style={{ flexShrink: 0, width: 130, scrollSnapAlign: "start", cursor: "pointer" }}
                >
                  <div style={{
                    position: "relative", width: 130, height: 195, borderRadius: 12,
                    overflow: "hidden", background: "var(--bg3)", border: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 8,
                  }}>
                    <img src={posterUrl(show.poster_path, "w342")} alt={show.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.8)", borderRadius: 6, padding: "2px 6px", fontSize: "0.68rem", fontWeight: 700, color: "#FBBF24" }}>
                      ⭐ {show.vote_average?.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {show.name}
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
