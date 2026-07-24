import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies } from "../context/MovieContext";
import { posterUrl } from "../utils/tmdb";

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY || "0ca631e5b6da1c2581df9bc13a674c86";
const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdb(endpoint, params = {}) {
  if (!TMDB_KEY) return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}

const epKey = (s, e) => `S${s}E${e}`;
const stillUrl = (p) => p ? `https://image.tmdb.org/t/p/w300${p}` : null;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  return `In ${diff} day${diff !== 1 ? "s" : ""}`;
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Section heading ────────────────────────────────────────────
function SectionHeader({ title, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <div style={{ width: 4, height: 28, borderRadius: 2, background: "var(--grad)", flexShrink: 0 }} />
      <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>{title}</h2>
      {count > 0 && (
        <span style={{ background: "rgba(236,72,153,0.15)", border: "1px solid rgba(236,72,153,0.3)", color: "var(--accent)", borderRadius: 20, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700 }}>{count}</span>
      )}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, display: "flex", gap: 18, animation: "shimmer 1.5s infinite", backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)" }}>
      <div style={{ width: 100, height: 148, borderRadius: 10, background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ height: 20, borderRadius: 4, background: "rgba(255,255,255,0.05)", width: "60%" }} />
        <div style={{ height: 14, borderRadius: 4, background: "rgba(255,255,255,0.04)", width: "40%" }} />
        <div style={{ height: 100, borderRadius: 8, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
        <div style={{ height: 36, borderRadius: 8, background: "rgba(255,255,255,0.04)", width: 160 }} />
      </div>
    </div>
  );
}

// ── Watch Next Card ───────────────────────────────────────────
function WatchNextCard({ card, onMarked, onOpenShow }) {
  const { toggleEpisode, updateMovie } = useMovies();
  const [marking, setMarking] = useState(false);
  const [localWatched, setLocalWatched] = useState(false);

  const { show, showDetails, nextEp, nextSeason, watchedSet, seasonEpisodes } = card;
  if (!nextEp) return null;

  const totalEps      = showDetails?.number_of_episodes || show.totalEpisodes || 0;
  const watchedCount  = watchedSet.size;
  const pct           = totalEps > 0 ? Math.round((watchedCount / totalEps) * 100) : 0;
  const key           = epKey(nextSeason, nextEp.episode_number);
  const alreadyWatched= watchedSet.has(key) || localWatched;

  const handleMark = async () => {
    if (marking || alreadyWatched) return;
    setMarking(true);
    setLocalWatched(true);
    try {
      let entry = show;
      if (!entry._id) return;
      await toggleEpisode(entry._id, key, true);
      // If status is watchlist, upgrade to watching
      if (entry.status === "watchlist") {
        await updateMovie(entry._id, { status: "watching" });
      }
      onMarked?.(show._id, key);
    } catch (_) {
      setLocalWatched(false);
    }
    setMarking(false);
  };

  const isAired = !nextEp.air_date || new Date(nextEp.air_date) <= new Date();

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: 20,
      display: "flex",
      gap: 18,
      transition: "border-color 0.2s, transform 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
    >
      {/* Poster */}
      <div
        style={{ width: 100, flexShrink: 0, cursor: "pointer" }}
        onClick={() => onOpenShow?.(show)}
      >
        {show.poster
          ? <img src={show.poster} alt={show.title} style={{ width: 100, height: 148, objectFit: "cover", borderRadius: 10, display: "block", boxShadow: "0 4px 16px rgba(0,0,0,0.6)" }} />
          : <div style={{ width: 100, height: 148, borderRadius: 10, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>📺</div>
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <button
            onClick={() => onOpenShow?.(show)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 2 }}>{show.title}</div>
          </button>
          {showDetails?.vote_average > 0 && (
            <span style={{ fontSize: "0.72rem", color: "#FBBF24", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>⭐ {showDetails.vote_average.toFixed(1)}</span>
          )}
        </div>

        {/* Episode badge */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span style={{
            background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)",
            color: "var(--accent)", borderRadius: 6, padding: "3px 9px",
            fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.5px",
          }}>
            S{String(nextSeason).padStart(2, "0")} · E{String(nextEp.episode_number).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {nextEp.name}
          </span>
        </div>

        {/* Episode thumbnail + meta */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {/* Still image */}
          <div style={{ width: 160, height: 90, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "var(--bg3)" }}>
            {stillUrl(nextEp.still_path)
              ? <img src={stillUrl(nextEp.still_path)} alt={nextEp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🎞️</div>
            }
          </div>
          {/* Meta + overview */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              {nextEp.air_date && (
                <span style={{ fontSize: "0.7rem", color: "var(--text3)" }}>📅 {formatDate(nextEp.air_date)}</span>
              )}
              {nextEp.runtime && (
                <span style={{ fontSize: "0.7rem", color: "var(--text3)" }}>🕐 {nextEp.runtime}m</span>
              )}
              {nextEp.vote_average > 0 && (
                <span style={{ fontSize: "0.7rem", color: "#FBBF24" }}>⭐ {nextEp.vote_average.toFixed(1)}</span>
              )}
            </div>
            {nextEp.overview && (
              <p style={{
                fontSize: "0.75rem", color: "var(--text2)", lineHeight: 1.6, margin: 0,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
              }}>
                {nextEp.overview}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: "0.68rem", color: "var(--text3)" }}>Series Progress</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text3)" }}>{watchedCount} / {totalEps} · {pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: pct === 100 ? "var(--green)" : "var(--grad)",
              width: `${pct}%`, transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isAired ? (
            <button
              onClick={handleMark}
              disabled={marking || alreadyWatched}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 10, fontSize: "0.83rem", fontWeight: 700,
                cursor: alreadyWatched ? "default" : "pointer",
                border: "none",
                background: alreadyWatched
                  ? "rgba(16,185,129,0.15)"
                  : marking ? "rgba(255,255,255,0.06)" : "var(--grad)",
                color: alreadyWatched ? "#34D399" : "#fff",
                boxShadow: alreadyWatched ? "none" : "0 4px 14px rgba(236,72,153,0.35)",
                transition: "all 0.2s",
                opacity: marking ? 0.7 : 1,
              }}
            >
              {alreadyWatched
                ? <><span style={{ fontSize: "1rem" }}>✓</span> Watched</>
                : marking
                  ? <><span className="spinner" /> Saving…</>
                  : <><span style={{ fontSize: "1rem" }}>✓</span> Mark as Watched</>
              }
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399", fontSize: "0.8rem", fontWeight: 600 }}>
              ⏰ Airs {daysUntil(nextEp.air_date) || formatDate(nextEp.air_date)}
            </div>
          )}
          <button
            onClick={() => onOpenShow?.(show)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text2)", transition: "all 0.2s" }}
          >
            📺 Show Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upcoming Episode Card ─────────────────────────────────────
function UpcomingCard({ card, onOpenShow }) {
  const { show, showDetails } = card;
  const nextEp = showDetails?.next_episode_to_air;
  if (!nextEp || new Date(nextEp.air_date) <= new Date()) return null;

  const countdown = daysUntil(nextEp.air_date);

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(16,185,129,0.15)",
      borderRadius: 16, padding: 18,
      display: "flex", gap: 16, alignItems: "center",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(16,185,129,0.15)"}
    >
      {/* Poster */}
      <div style={{ cursor: "pointer" }} onClick={() => onOpenShow?.(show)}>
        {show.poster
          ? <img src={show.poster} alt={show.title} style={{ width: 72, height: 106, objectFit: "cover", borderRadius: 8, display: "block", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }} />
          : <div style={{ width: 72, height: 106, borderRadius: 8, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>📺</div>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <button onClick={() => onOpenShow?.(show)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", marginBottom: 6 }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>{show.title}</div>
        </button>
        <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#34D399", borderRadius: 6, padding: "2px 8px", fontSize: "0.68rem", fontWeight: 700 }}>
            S{String(nextEp.season_number).padStart(2,"0")} · E{String(nextEp.episode_number).padStart(2,"0")}
          </span>
          <span style={{ fontSize: "0.8rem", color: "var(--text2)", fontWeight: 600 }}>{nextEp.name}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>📅 {formatDate(nextEp.air_date)}</span>
          {nextEp.runtime && <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>🕐 {nextEp.runtime}m</span>}
        </div>
      </div>

      {/* Countdown badge */}
      <div style={{
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: 10, padding: "8px 14px", textAlign: "center", flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.62rem", color: "#34D399", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 2 }}>Airs</div>
        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#34D399" }}>{countdown || formatDate(nextEp.air_date)}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function ContinueWatchingPage() {
  const { movies } = useMovies();
  const navigate = useNavigate();
  const [tab, setTab]         = useState("watchnext");
  const [cards, setCards]     = useState([]);
  const [loading, setLoading] = useState(true);

  const handleOpenShow = (show) => {
    const tmdbId = show.tmdbId || show.id || show._id;
    navigate(`/tv/${tmdbId}`);
  };

  // Cache: tmdbId -> { details, seasonMap: { seasonNum: episodes[] } }
  const cache = useRef({});

  // Shows the user is actively watching
  const watchingShows = movies.filter(m => m.type === "tv" && m.status === "watching");

  // ── Fetch TMDb data & compute cards ─────────────────────────
  const buildCards = useCallback(async (shows, forceIds = new Set()) => {
    const results = await Promise.all(shows.map(async (show) => {
      const id = show.tmdbId;
      if (!id) return null;

      // Fetch show details if not cached or forced
      if (!cache.current[id] || forceIds.has(id)) {
        const details = await tmdb(`/tv/${id}`, { append_to_response: "next_episode_to_air" });
        cache.current[id] = { details, seasonMap: cache.current[id]?.seasonMap || {} };
      }
      const { details } = cache.current[id];
      if (!details) return null;

      const watchedSet = new Set(show.watchedEpisodeIds || []);
      const seasons    = (details.seasons || []).filter(s => s.season_number > 0);

      // Find which season has the next unwatched episode
      let nextEp = null, nextSeason = null, seasonEpisodes = [];

      for (const season of seasons) {
        const sNum = season.season_number;
        const watchedInSeason = [...watchedSet].filter(k => k.startsWith(`S${sNum}E`)).length;

        // If this season has un-watched episodes, fetch it if not cached
        if (watchedInSeason < season.episode_count) {
          if (!cache.current[id].seasonMap[sNum]) {
            const sd = await tmdb(`/tv/${id}/season/${sNum}`);
            cache.current[id].seasonMap[sNum] = sd?.episodes || [];
          }
          seasonEpisodes = cache.current[id].seasonMap[sNum];
          nextEp = seasonEpisodes.find(ep => !watchedSet.has(epKey(sNum, ep.episode_number)));
          if (nextEp) { nextSeason = sNum; break; }
        }
      }

      return { show, showDetails: details, nextEp, nextSeason, watchedSet, seasonEpisodes };
    }));

    return results.filter(Boolean);
  }, []);

  // Initial load
  useEffect(() => {
    if (!watchingShows.length) { setCards([]); setLoading(false); return; }
    setLoading(true);
    buildCards(watchingShows).then(c => { setCards(c); setLoading(false); });
  }, [watchingShows.map(s => s.tmdbId).join(",")]);

  // Re-derive cards when watchedEpisodeIds change (after toggling episode)
  // Uses cached TMDb data — no extra API calls
  useEffect(() => {
    if (!watchingShows.length || loading) return;
    buildCards(watchingShows).then(c => setCards(c));
  }, [movies]);

  // When an episode is marked on this page, advance the card's next episode
  const handleMarked = useCallback((showId, markedKey) => {
    setCards(prev => prev.map(card => {
      if (card.show._id !== showId) return card;
      const newWatched = new Set(card.watchedSet);
      newWatched.add(markedKey);
      // Find next episode from already-loaded season data
      const episodes = cache.current[card.show.tmdbId]?.seasonMap[card.nextSeason] || [];
      let nextEp = episodes.find(ep => !newWatched.has(epKey(card.nextSeason, ep.episode_number)));
      let nextSeason = card.nextSeason;
      // If season exhausted, this will be corrected on the next movies context update
      return { ...card, watchedSet: newWatched, nextEp: nextEp ?? null };
    }));
  }, []);

  // Separate cards for upcoming tab (shows where next episode hasn't aired)
  const upcomingCards = cards.filter(c => {
    const nextAirEp = c.showDetails?.next_episode_to_air;
    return nextAirEp && new Date(nextAirEp.air_date) > new Date();
  });

  const watchNextCards = cards.filter(c => {
    if (!c.nextEp) return false;
    if (!c.nextEp.air_date) return true;
    return new Date(c.nextEp.air_date) <= new Date();
  });

  const pendingCards = cards.filter(c => {
    if (!c.nextEp) return false;
    if (!c.nextEp.air_date) return false;
    return new Date(c.nextEp.air_date) > new Date();
  });

  return (
    <div style={{ minHeight: "100vh", padding: "32px 0 60px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Page header ── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.6rem", letterSpacing: "2px", background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 6 }}>
            Continue Watching
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text3)", margin: 0 }}>
            {watchingShows.length === 0
              ? "No shows in progress — mark a TV show as \"Watching\" to see it here."
              : `${watchingShows.length} show${watchingShows.length !== 1 ? "s" : ""} in progress`}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {[
            { id: "watchnext", label: "▶ Watch Next",    count: watchNextCards.length },
            { id: "upcoming",  label: "📅 Upcoming",     count: upcomingCards.length  },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 18px", borderRadius: 9, fontSize: "0.83rem", fontWeight: 700,
                cursor: "pointer", transition: "all 0.2s",
                background: tab === t.id ? "var(--grad)" : "transparent",
                border: "none",
                color: tab === t.id ? "#fff" : "var(--text2)",
                boxShadow: tab === t.id ? "0 2px 8px rgba(236,72,153,0.35)" : "none",
                display: "flex", alignItems: "center", gap: 7,
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span style={{ background: tab === t.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)", borderRadius: 12, padding: "1px 7px", fontSize: "0.7rem" }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ WATCH NEXT TAB ══════════════════════════════════ */}
        {tab === "watchnext" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : watchingShows.length === 0 ? (
              <EmptyState
                icon="📺"
                title="No shows in progress"
                sub={`Mark a TV show as "Watching" from the TV Shows page or from any show's detail page.`}
              />
            ) : watchNextCards.length === 0 && pendingCards.length === 0 ? (
              <EmptyState
                icon="🎉"
                title="All caught up!"
                sub={`You've watched all available episodes of your current shows. Check Upcoming for what's coming next.`}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {watchNextCards.length > 0 && (
                  <>
                    <SectionHeader title="Up Next" count={watchNextCards.length} />
                    {watchNextCards.map(card => (
                      <WatchNextCard
                        key={card.show._id}
                        card={card}
                        onMarked={handleMarked}
                        onOpenShow={handleOpenShow}
                      />
                    ))}
                  </>
                )}

                {pendingCards.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <SectionHeader title="Waiting to Air" count={pendingCards.length} />
                    {pendingCards.map(card => (
                      <WatchNextCard
                        key={card.show._id}
                        card={card}
                        onMarked={handleMarked}
                        onOpenShow={handleOpenShow}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ UPCOMING TAB ════════════════════════════════════ */}
        {tab === "upcoming" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : upcomingCards.length === 0 ? (
              <EmptyState
                icon="📅"
                title="No upcoming episodes found"
                sub="Upcoming episodes for shows you're watching will appear here once TMDb has air date data."
              />
            ) : (
              <>
                <SectionHeader title="Coming Soon" count={upcomingCards.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {upcomingCards
                    .slice()
                    .sort((a, b) => {
                      const aDate = a.showDetails?.next_episode_to_air?.air_date || "";
                      const bDate = b.showDetails?.next_episode_to_air?.air_date || "";
                      return aDate.localeCompare(bDate);
                    })
                    .map(card => (
                      <UpcomingCard
                        key={card.show._id}
                        card={card}
                        onOpenShow={handleOpenShow}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: "0.85rem", color: "var(--text3)", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>{sub}</div>
    </div>
  );
}
