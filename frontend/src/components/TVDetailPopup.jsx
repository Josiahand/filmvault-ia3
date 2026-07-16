import { useState, useEffect, useRef } from "react";
import { useMovies } from "../context/MovieContext";
import { tmdb, posterUrl, profileUrl, stillUrl, backdropUrl } from "../utils/tmdb";
import StarRating from "./StarRating";
import ActorDetailPopup from "./ActorDetailPopup";

// ── Episode key helper ─────────────────────────────────────────
const epKey = (season, ep) => `S${season}E${ep}`;

// ── Section title ──────────────────────────────────────────────
function SectionTitle({ children, accent }) {
  return (
    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 3, height: 18, borderRadius: 2, background: accent || "var(--grad)", display: "inline-block", flexShrink: 0 }} />
      {children}
    </div>
  );
}

// ── Horizontal scroll wrapper ─────────────────────────────────
function HScroll({ children }) {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 600, behavior: "smooth" });
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => scroll(-1)} className="tvdp-arrow tvdp-arrow-l">‹</button>
      <div ref={ref} className="tvdp-hscroll">{children}</div>
      <button onClick={() => scroll(1)}  className="tvdp-arrow tvdp-arrow-r">›</button>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ watched, total, label, sub }) {
  const pct = total > 0 ? Math.round((watched / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>{label}</span>
        <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>{watched} / {total} · {pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: pct === 100 ? "var(--green)" : "var(--grad)",
          width: `${pct}%`, transition: "width 0.4s ease",
        }} />
      </div>
      {sub && <div style={{ fontSize: "0.68rem", color: "var(--text3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 0, textAlign: "center" }}>
      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: color || "#fff", marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── Days until countdown ───────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today!";
  return `In ${diff} day${diff !== 1 ? "s" : ""}`;
}

// ══════════════════════════════════════════════════════════════
//  MAIN TV DETAIL POPUP
// ══════════════════════════════════════════════════════════════
export default function TVDetailPopup({ item, onClose, onOpenShow }) {
  const { addMovie, movies, updateMovie, toggleEpisode } = useMovies();

  // ── Fetch state ─────────────────────────────────────────────
  const [details,     setDetails]     = useState(null);
  const [cast,        setCast]        = useState([]);
  const [similar,     setSimilar]     = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [seasonData,  setSeasonData]  = useState(null);  // fetched season detail
  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // ── User / status state ─────────────────────────────────────
  const [status,    setStatus]    = useState("watchlist");
  const [rating,    setRating]    = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [activeSeason, setActiveSeason] = useState(1);
  // Local optimistic set of watched episode keys
  const [watchedSet, setWatchedSet] = useState(new Set());
  const [toggling, setToggling] = useState({}); // episodeKey -> bool
  const [selectedActorId, setSelectedActorId] = useState(null);

  const tmdbId   = item.id || item.tmdbId;
  const showName = item.name || item.title || "";
  const existing = movies.find(m => (m.tmdbId === tmdbId || (item._id && m._id === item._id)) && m.type === "tv");

  // Initialise status/rating/watchedSet from library
  useEffect(() => {
    if (existing) {
      setStatus(existing.status || "watchlist");
      setRating(existing.rating || 0);
      setWatchedSet(new Set(existing.watchedEpisodeIds || []));
    }
  }, [existing?._id]);

  // ── Main fetch ───────────────────────────────────────────────
  useEffect(() => {
    if (!tmdbId) { setLoadingMain(false); return; }
    setLoadingMain(true);
    Promise.all([
      tmdb(`/tv/${tmdbId}`, { append_to_response: "credits,next_episode_to_air,last_episode_to_air" }),
      tmdb(`/tv/${tmdbId}/similar`),
      tmdb(`/tv/${tmdbId}/recommendations`),
    ]).then(([det, sim, rec]) => {
      setDetails(det);
      setCast((det?.credits?.cast || []).slice(0, 15));
      setSimilar((sim?.results || []).filter(s => s.poster_path).slice(0, 20));
      setRecommended((rec?.results || []).filter(s => s.poster_path).slice(0, 20));
      // Start on first real season (skip specials if possible)
      const firstSeason = det?.seasons?.find(s => s.season_number > 0)?.season_number || 1;
      setActiveSeason(firstSeason);
      setLoadingMain(false);
    }).catch(() => setLoadingMain(false));
  }, [tmdbId]);

  // ── Season fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (!tmdbId || !activeSeason) return;
    setLoadingSeason(true);
    setSeasonData(null);
    tmdb(`/tv/${tmdbId}/season/${activeSeason}`).then(data => {
      setSeasonData(data);
      setLoadingSeason(false);
    }).catch(() => setLoadingSeason(false));
  }, [tmdbId, activeSeason]);

  // ── Ensure library entry exists, then return its _id ─────────
  const ensureEntry = async () => {
    if (existing) return existing;
    const det = details || item;
    const genres = det?.genres || [];
    return await addMovie({
      tmdbId:        tmdbId,
      title:         showName || det?.name || "",
      type:          "tv",
      year:          item.first_air_date?.split("-")[0] || item.year || det?.first_air_date?.split("-")[0] || "",
      poster:        item.poster_path ? posterUrl(item.poster_path) : item.poster || (det?.poster_path ? posterUrl(det.poster_path) : ""),
      overview:      item.overview || det?.overview || "",
      genre:         genres[0]?.name || item.genre || "Other",
      status:        "watching",
      rating:        0,
      review:        "",
      totalSeasons:  det?.number_of_seasons  || null,
      totalEpisodes: det?.number_of_episodes || null,
      watchedEpisodes: 0,
      currentSeason: 1,
      watchedEpisodeIds: [],
    });
  };

  // ── Status save ──────────────────────────────────────────────
  const handleStatusSave = async (newStatus) => {
    const s = newStatus ?? status;
    setSaving(true);
    try {
      const entry = existing
        ? await updateMovie(existing._id, { status: s, rating })
        : await addMovie({
            tmdbId:        item.id,
            title:         showName,
            type:          "tv",
            year:          item.first_air_date?.split("-")[0] || "",
            poster:        item.poster_path ? posterUrl(item.poster_path) : "",
            overview:      item.overview || "",
            genre:         details?.genres?.[0]?.name || "Other",
            status:        s,
            rating,
            review:        "",
            totalSeasons:  details?.number_of_seasons  || null,
            totalEpisodes: details?.number_of_episodes || null,
            watchedEpisodes: 0,
            currentSeason: 1,
            watchedEpisodeIds: [],
          });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {}
    setSaving(false);
  };

  // ── Toggle single episode ────────────────────────────────────
  const handleEpisodeToggle = useCallback(async (seasonNum, epNum) => {
    const key = epKey(seasonNum, epNum);
    const nowWatched = !watchedSet.has(key);

    // Optimistic update
    setWatchedSet(prev => {
      const next = new Set(prev);
      nowWatched ? next.add(key) : next.delete(key);
      return next;
    });
    setToggling(prev => ({ ...prev, [key]: true }));

    try {
      let entry = existing;
      if (!entry) entry = await ensureEntry();
      await toggleEpisode(entry._id, key, nowWatched);
    } catch (_) {
      // Rollback on failure
      setWatchedSet(prev => {
        const next = new Set(prev);
        nowWatched ? next.delete(key) : next.add(key);
        return next;
      });
    }
    setToggling(prev => ({ ...prev, [key]: false }));
  }, [watchedSet, existing, details, toggleEpisode]);

  // ── Mark entire season watched/unwatched ─────────────────────
  const handleSeasonBulk = async (watched) => {
    if (!seasonData?.episodes) return;
    const keys = seasonData.episodes.map(e => epKey(activeSeason, e.episode_number));
    // Optimistic
    setWatchedSet(prev => {
      const next = new Set(prev);
      keys.forEach(k => watched ? next.add(k) : next.delete(k));
      return next;
    });
    try {
      let entry = existing;
      if (!entry) entry = await ensureEntry();
      const allIds = watched
        ? [...new Set([...Array.from(watchedSet), ...keys])]
        : Array.from(watchedSet).filter(k => !keys.includes(k));
      await updateMovie(entry._id, {
        watchedEpisodeIds: allIds,
        watchedEpisodes:   allIds.length,
      });
    } catch (_) {}
  };

  // ── Continue Watching ────────────────────────────────────────
  const handleContinue = () => {
    if (!details?.seasons) return;
    for (const season of details.seasons) {
      if (season.season_number === 0) continue;
      for (let ep = 1; ep <= (season.episode_count || 0); ep++) {
        if (!watchedSet.has(epKey(season.season_number, ep))) {
          setActiveSeason(season.season_number);
          // Scroll to episode list
          document.getElementById("tvdp-episodes")?.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
    }
  };

  // ── Derived values ───────────────────────────────────────────
  const d          = details || item;
  const tmdbScore  = (d.vote_average || 0).toFixed(1);
  const voteCount  = details?.vote_count?.toLocaleString() || "—";
  const popularity = details?.popularity?.toFixed(0) || "—";
  const genres     = details?.genres?.map(g => g.name) || [];
  const seasons    = (details?.seasons || []).filter(s => s.season_number > 0);
  const totalEps   = details?.number_of_episodes || 0;
  const status_str = details?.status || "";
  const nextEp     = details?.next_episode_to_air;
  const airDate    = item.first_air_date?.split("-")[0];
  const backdrop   = d.backdrop_path ? `https://image.tmdb.org/t/p/original${d.backdrop_path}` : null;
  const poster     = d.poster_path   ? posterUrl(d.poster_path, "w342") : null;

  // Season progress
  const seasonEps    = seasonData?.episodes || [];
  const seasonWatched = seasonEps.filter(e => watchedSet.has(epKey(activeSeason, e.episode_number))).length;
  const overallWatched = watchedSet.size;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ alignItems: "flex-start", padding: "24px 12px", overflowY: "auto" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 920, margin: "0 auto",
          background: "#141414", borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
          animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >

        {/* ══ BACKDROP HERO ═══════════════════════════════════ */}
        <div style={{ position: "relative", height: 340, overflow: "hidden" }}>
          {backdrop
            ? <img src={backdrop} alt={showName} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1A1A2E, #16213E, #0F3460)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6rem" }}>📺</div>
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #141414 0%, rgba(20,20,20,0.3) 55%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(20,20,20,0.7) 0%, transparent 60%)" }} />

          {/* Close */}
          <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>✕</button>

          {/* TMDb badge */}
          <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.75)", border: "1.5px solid rgba(88,166,255,0.5)", borderRadius: 8, padding: "4px 10px", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#FBBF24", fontSize: "0.82rem" }}>⭐</span>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.9rem" }}>{tmdbScore}</span>
            <span style={{ color: "var(--text3)", fontSize: "0.72rem" }}>/10</span>
          </div>

          {/* Status pill */}
          {status_str && (
            <div style={{ position: "absolute", top: 16, left: 110, background: status_str === "Ended" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", border: `1.5px solid ${status_str === "Ended" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`, color: status_str === "Ended" ? "#F87171" : "#34D399", borderRadius: 8, padding: "4px 10px", backdropFilter: "blur(8px)", fontSize: "0.75rem", fontWeight: 700 }}>
              {status_str === "Ended" ? "🔴 Ended" : "🟢 Airing"}
            </div>
          )}
        </div>

        {/* ══ POSTER + HEADER ═════════════════════════════════ */}
        <div style={{ display: "flex", gap: 22, padding: "0 26px", marginTop: -80, position: "relative", zIndex: 2 }}>
          {poster
            ? <img src={poster} alt={showName} style={{ width: 120, height: 180, objectFit: "cover", borderRadius: 10, border: "3px solid rgba(255,255,255,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.8)", flexShrink: 0 }} />
            : <div style={{ width: 120, height: 180, borderRadius: 10, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", border: "3px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>📺</div>
          }
          <div style={{ flex: 1, paddingTop: 88, minWidth: 0 }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.2rem", letterSpacing: "2px", color: "#fff", lineHeight: 1, marginBottom: 8 }}>
              {showName}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14, alignItems: "center" }}>
              {airDate && <span style={{ fontSize: "0.78rem", color: "var(--text2)", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>{airDate}</span>}
              {details?.number_of_seasons  && <span style={{ fontSize: "0.78rem", color: "var(--text2)", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>📺 {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? "s" : ""}</span>}
              {details?.number_of_episodes && <span style={{ fontSize: "0.78rem", color: "var(--text2)", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" }}>🎬 {details.number_of_episodes} Episodes</span>}
              {genres.slice(0, 3).map(g => (
                <span key={g} style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--blue)", background: "rgba(88,166,255,0.1)", border: "1px solid rgba(88,166,255,0.25)", padding: "3px 10px", borderRadius: 20 }}>{g}</span>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                disabled={saving}
                onClick={() => { setStatus("watchlist"); handleStatusSave("watchlist"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  background: status === "watchlist" ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.06)",
                  border: status === "watchlist" ? "1.5px solid rgba(59,130,246,0.55)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watchlist" ? "#60A5FA" : "var(--text2)",
                }}
              >
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg>
                Watchlist
              </button>
              <button
                disabled={saving}
                onClick={() => { setStatus("watching"); handleStatusSave("watching"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  background: status === "watching" ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.06)",
                  border: status === "watching" ? "1.5px solid rgba(236,72,153,0.55)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watching" ? "var(--accent)" : "var(--text2)",
                }}
              >
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
                Mark as Watching
              </button>
              <button
                disabled={saving}
                onClick={() => { setStatus("watched"); handleStatusSave("watched"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  background: status === "watched" ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.06)",
                  border: status === "watched" ? "1.5px solid rgba(16,185,129,0.55)" : "1px solid rgba(255,255,255,0.1)",
                  color: status === "watched" ? "#34D399" : "var(--text2)",
                }}
              >
                <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Finished
              </button>
              <button
                onClick={handleContinue}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "var(--grad)", border: "none", color: "#fff" }}
              >▶ Continue Watching</button>
              {saved && <span style={{ fontSize: "0.78rem", color: "#34D399", fontWeight: 600 }}>✓ Saved!</span>}
            </div>
          </div>
        </div>

        {/* ══ BODY ════════════════════════════════════════════ */}
        <div style={{ padding: "24px 26px 36px", display: "flex", flexDirection: "column", gap: 30 }}>

          {/* ── Overview ── */}
          {d.overview && (
            <div>
              <SectionTitle>Overview</SectionTitle>
              <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.8, margin: 0 }}>{d.overview}</p>
            </div>
          )}

          {/* ── Ratings & Stats ── */}
          <div>
            <SectionTitle>Ratings &amp; Stats</SectionTitle>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatPill label="TMDb Rating" value={`⭐ ${tmdbScore}`} color="#FBBF24" />
              <StatPill label="Vote Count"  value={voteCount}          color="var(--blue)" />
              <StatPill label="Popularity"  value={popularity}         color="var(--accent)" />
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 0, textAlign: "center" }}>
                <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}>
                  <StarRating value={rating} onChange={r => { setRating(r); if (existing) updateMovie(existing._id, { rating: r }); }} size="sm" />
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Your Rating</div>
              </div>
            </div>
          </div>

          {/* ── Cast ── */}
          {(loadingMain || cast.length > 0) && (
            <div>
              <SectionTitle>Cast</SectionTitle>
              {loadingMain ? (
                <div style={{ display: "flex", gap: 12 }}>
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ width: 80, height: 80, borderRadius: "50%", background: "#1A1A1A", animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%", flexShrink: 0 }} />)}
                </div>
              ) : (
                <HScroll>
                  {cast.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedActorId(p.id)}
                      style={{
                        flexShrink: 0, width: 90,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                        scrollSnapAlign: "start", cursor: "pointer",
                      }}
                      title={`View ${p.name}`}
                    >
                      {profileUrl(p.profile_path)
                        ? <img src={profileUrl(p.profile_path)} alt={p.name} style={{ width: 74, height: 74, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.12)" }} />
                        : <div style={{ width: 74, height: 74, borderRadius: "50%", background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>👤</div>
                      }
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ fontSize: "0.62rem", color: "var(--text3)", lineHeight: 1.3 }}>{p.character}</div>
                      </div>
                    </div>
                  ))}
                </HScroll>
              )}
            </div>
          )}

          {/* ── Next Episode ── */}
          {nextEp && (
            <div>
              <SectionTitle accent="linear-gradient(135deg,#34D399,#059669)">Next Episode</SectionTitle>
              <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                {nextEp.still_path && (
                  <img src={stillUrl(nextEp.still_path, "w185")} alt="" style={{ width: 100, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#34D399", fontWeight: 700, marginBottom: 3 }}>S{nextEp.season_number}E{nextEp.episode_number}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{nextEp.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text2)", display: "flex", gap: 10 }}>
                    <span>📅 {nextEp.air_date}</span>
                    {daysUntil(nextEp.air_date) && <span style={{ color: "#34D399", fontWeight: 600 }}>⏰ {daysUntil(nextEp.air_date)}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Overall Progress ── */}
          {totalEps > 0 && (
            <div>
              <SectionTitle>Series Progress</SectionTitle>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
                <ProgressBar
                  watched={overallWatched}
                  total={totalEps}
                  label="Overall Series Progress"
                  sub={overallWatched === totalEps ? "🎉 Completed!" : `${totalEps - overallWatched} episodes remaining`}
                />
              </div>
            </div>
          )}

          {/* ══ SEASON & EPISODE BROWSER ════════════════════════ */}
          {seasons.length > 0 && (
            <div id="tvdp-episodes">
              <SectionTitle>Seasons &amp; Episodes</SectionTitle>

              {/* Season tabs */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                {seasons.map(s => {
                  const sWatched = Array.from(watchedSet).filter(k => k.startsWith(`S${s.season_number}E`)).length;
                  const sPct = s.episode_count > 0 ? Math.round((sWatched / s.episode_count) * 100) : 0;
                  const isActive = activeSeason === s.season_number;
                  return (
                    <button
                      key={s.season_number}
                      onClick={() => setActiveSeason(s.season_number)}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.2s", position: "relative",
                        background: isActive ? "var(--grad)" : "rgba(255,255,255,0.05)",
                        border: isActive ? "none" : "1px solid rgba(255,255,255,0.1)",
                        color: isActive ? "#fff" : "var(--text2)",
                        boxShadow: isActive ? "0 4px 14px rgba(236,72,153,0.35)" : "none",
                      }}
                    >
                      Season {s.season_number}
                      {sPct === 100 && <span style={{ marginLeft: 5, color: isActive ? "#fff" : "#34D399" }}>✓</span>}
                      {sPct > 0 && sPct < 100 && (
                        <span style={{ marginLeft: 5, fontSize: "0.65rem", opacity: 0.8 }}>{sPct}%</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Season progress + quick actions */}
              {seasonData && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <ProgressBar
                    watched={seasonWatched}
                    total={seasonEps.length}
                    label={`Season ${activeSeason} Progress`}
                  />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <button
                      onClick={() => handleSeasonBulk(true)}
                      style={{ padding: "6px 14px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34D399", cursor: "pointer" }}
                    >✓ Mark Season Watched</button>
                    <button
                      onClick={() => handleSeasonBulk(false)}
                      style={{ padding: "6px 14px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text2)", cursor: "pointer" }}
                    >✗ Mark Season Unwatched</button>
                  </div>
                </div>
              )}

              {/* Episode list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 480, overflowY: "auto", paddingRight: 4 }} className="tvdp-eps-scroll">
                {loadingSeason ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ height: 80, borderRadius: 10, background: "#1A1A1A", animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%", animationDelay: `${i * 0.1}s` }} />
                  ))
                ) : (seasonData?.episodes || []).map(ep => {
                  const key     = epKey(activeSeason, ep.episode_number);
                  const isWatched = watchedSet.has(key);
                  const isToggling= toggling[key];
                  const still   = stillUrl(ep.still_path);
                  const epRating= ep.vote_average?.toFixed(1);
                  return (
                    <div
                      key={ep.id}
                      style={{
                        display: "flex", gap: 12, alignItems: "flex-start",
                        background: isWatched ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isWatched ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)"}`,
                        borderRadius: 10, padding: "10px 12px",
                        transition: "all 0.2s",
                      }}
                    >
                      {/* Still image */}
                      <div style={{ width: 110, height: 62, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "var(--bg3)" }}>
                        {still
                          ? <img src={still} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>🎞️</div>
                        }
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
                          <span style={{ fontSize: "0.68rem", color: "var(--text3)", fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>E{ep.episode_number}</span>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{ep.name}</span>
                        </div>
                        <div style={{ display: "flex", gap: 10, fontSize: "0.68rem", color: "var(--text3)", marginBottom: 4, flexWrap: "wrap" }}>
                          {ep.air_date && <span>📅 {ep.air_date}</span>}
                          {ep.runtime  && <span>🕐 {ep.runtime}m</span>}
                          {epRating && parseFloat(epRating) > 0 && <span>⭐ {epRating}</span>}
                        </div>
                        {ep.overview && (
                          <p style={{ fontSize: "0.72rem", color: "var(--text3)", lineHeight: 1.5, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {ep.overview}
                          </p>
                        )}
                      </div>

                      {/* Watched toggle */}
                      <button
                        onClick={() => handleEpisodeToggle(activeSeason, ep.episode_number)}
                        disabled={isToggling}
                        style={{
                          flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                          border: isWatched ? "2px solid #34D399" : "2px solid rgba(255,255,255,0.15)",
                          background: isWatched ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.04)",
                          color: isWatched ? "#34D399" : "var(--text3)",
                          fontSize: "0.9rem", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s",
                          opacity: isToggling ? 0.5 : 1,
                        }}
                        title={isWatched ? "Mark unwatched" : "Mark watched"}
                      >
                        {isToggling ? "…" : isWatched ? "✓" : "○"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Similar Shows ── */}
          {(loadingMain || similar.length > 0) && (
            <div>
              <SectionTitle>Similar Shows</SectionTitle>
              {loadingMain ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="row-card-skeleton" style={{ animationDelay: `${i * 0.06}s` }} />)}
                </div>
              ) : (
                <HScroll>
                  {similar.map(show => (
                    <div key={show.id} style={{ flexShrink: 0, width: 110, scrollSnapAlign: "start", cursor: "pointer" }} onClick={() => onOpenShow?.(show)}>
                      <div style={{ position: "relative", width: 110, height: 165, borderRadius: 8, overflow: "hidden", marginBottom: 6, background: "var(--bg3)", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}>
                        {show.poster_path
                          ? <img src={posterUrl(show.poster_path, "w185")} alt={show.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📺</div>
                        }
                        <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.75)", borderRadius: 4, padding: "2px 5px", fontSize: "0.6rem", fontWeight: 700, color: "#fff" }}>⭐ {show.vote_average?.toFixed(1)}</div>
                      </div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{show.name}</div>
                    </div>
                  ))}
                </HScroll>
              )}
            </div>
          )}

          {/* ── Recommended Shows ── */}
          {(loadingMain || recommended.length > 0) && (
            <div>
              <SectionTitle>Recommended For You</SectionTitle>
              {loadingMain ? (
                <div style={{ display: "flex", gap: 10 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="row-card-skeleton" style={{ animationDelay: `${i * 0.06}s` }} />)}
                </div>
              ) : (
                <HScroll>
                  {recommended.map(show => (
                    <div key={show.id} style={{ flexShrink: 0, width: 110, scrollSnapAlign: "start", cursor: "pointer" }} onClick={() => onOpenShow?.(show)}>
                      <div style={{ position: "relative", width: 110, height: 165, borderRadius: 8, overflow: "hidden", marginBottom: 6, background: "var(--bg3)", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}>
                        {show.poster_path
                          ? <img src={posterUrl(show.poster_path, "w185")} alt={show.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>📺</div>
                        }
                        <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.75)", borderRadius: 4, padding: "2px 5px", fontSize: "0.6rem", fontWeight: 700, color: "#fff" }}>⭐ {show.vote_average?.toFixed(1)}</div>
                      </div>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{show.name}</div>
                    </div>
                  ))}
                </HScroll>
              )}
            </div>
          )}

        </div>
      </div>

      {selectedActorId && (
        <ActorDetailPopup
          actorId={selectedActorId}
          onClose={() => setSelectedActorId(null)}
          onOpenShow={s => onOpenShow ? onOpenShow(s) : null}
        />
      )}
    </div>
  );
}
