import { useState, useEffect, useCallback } from "react";
import { useMovies } from "../context/MovieContext";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";
import BrowseDetailPopup from "../components/BrowseDetailPopup";
import { posterUrl, fetchPopular } from "../utils/tmdb";

const GENRES = [
  { id:"all", name:"All" }, { id:28, name:"Action" }, { id:35, name:"Comedy" },
  { id:18, name:"Drama" }, { id:27, name:"Horror" }, { id:878, name:"Sci-Fi" },
  { id:10749, name:"Romance" }, { id:16, name:"Animation" }, { id:80, name:"Crime" },
  { id:99, name:"Documentary" }, { id:14, name:"Fantasy" }, { id:53, name:"Thriller" },
];

const SORT_OPTIONS = [
  { value:"popularity.desc",   label:"Most Popular" },
  { value:"vote_average.desc", label:"Top Rated" },
  { value:"release_date.desc", label:"Newest First" },
  { value:"revenue.desc",      label:"Box Office" },
];

// ── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection({ onAddToList }) {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    fetchPopular("movie", { sort_by:"popularity.desc", page:1, "vote_count.gte":100 })
      .then(data => {
        const picks = (data?.results || []).filter(m => m.backdrop_path);
        if (picks.length) setHero(picks[Math.floor(Math.random() * Math.min(5, picks.length))]);
      }).catch(() => {});
  }, []);

  if (!hero) return null;

  const score = Math.round((hero.vote_average || 0) * 10);
  const year  = hero.release_date?.split("-")[0];

  return (
    <div className="hero-section">
      <div className="hero-bg" />
      {hero.backdrop_path && (
        <img className="hero-bg-image" src={`https://image.tmdb.org/t/p/w1280${hero.backdrop_path}`} alt={hero.title} />
      )}
      <div className="hero-overlay" />
      <div className="hero-overlay-bottom" />
      <div className="hero-content">
        <div className="hero-badge">Featured Today</div>
        <div className="hero-title">{hero.title}</div>
        <div className="hero-meta">
          <div className="hero-rating">{score}%</div>
          {year && <div className="hero-year">{year}</div>}
          <div className="hero-genre">Movie</div>
        </div>
        {hero.overview && <div className="hero-overview">{hero.overview}</div>}
        <div className="hero-actions">
          <button className="hero-watch-btn" onClick={() => onAddToList(hero, "watchlist")}>
            + Add to Watchlist
          </button>
          <button className="hero-add-btn" onClick={() => onAddToList(hero, "watched")}>
            Mark as Watched
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BROWSE CARD with hover quick actions ──────────────────────────────────────
function BrowseCard({ item, type, onQuickAdd, onDetails, inLib, adding }) {
  const title      = type === "tv" ? item.name  : item.title;
  const year       = type === "tv" ? item.first_air_date?.split("-")[0] : item.release_date?.split("-")[0];
  const score      = Math.round((item.vote_average || 0) * 10);
  const scoreColor = score >= 75 ? "var(--green)" : score >= 50 ? "var(--accent)" : "var(--red)";
  const watchKey   = item.id + type;
  const watchedKey = item.id + type + "watched";
  const isAdding   = adding === watchKey || adding === watchedKey;

  return (
    <div className="browse-card">
      <div className="browse-poster-wrap">
        {item.poster_path
          ? <img className="browse-poster" src={posterUrl(item.poster_path)} alt={title} loading="lazy" />
          : <div className="browse-poster-placeholder" style={{ fontSize:"0.8rem", fontWeight:700, color:"var(--text3)" }}>
              {type === "tv" ? "TV" : "Film"}
            </div>
        }

        {/* Score badge */}
        <div className="browse-score" style={{ borderColor:scoreColor, color:scoreColor }}>
          {score}<span style={{ fontSize:"0.5rem" }}>%</span>
        </div>

        {/* Already in library badge */}
        {inLib && (
          <div style={{
            position:"absolute", top:8, right:8,
            background:"rgba(16,185,129,0.95)", borderRadius:"50%",
            width:26, height:26, display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:"0.78rem", fontWeight:700, color:"#000",
          }}>
            ✓
          </div>
        )}

        {/* ── HOVER OVERLAY — 3 quick action buttons ── */}
        <div
          className="browse-overlay"
          style={{ flexDirection:"column", gap:6, padding:10, alignItems:"stretch" }}
        >
          {/* View Details */}
          <button
            onClick={() => onDetails(item, type)}
            style={{
              width:"100%", padding:"7px 0",
              background:"rgba(255,255,255,0.10)",
              border:"1px solid rgba(255,255,255,0.22)",
              borderRadius:8, color:"#fff",
              fontSize:"0.76rem", fontWeight:600,
              cursor:"pointer", backdropFilter:"blur(8px)",
              letterSpacing:"0.3px",
            }}
          >
            View Details
          </button>

          {/* + Watchlist */}
          <button
            onClick={() => !inLib && onQuickAdd(item, type, "watchlist")}
            disabled={isAdding || inLib}
            style={{
              width:"100%", padding:"8px 0",
              background: inLib ? "rgba(59,130,246,0.3)" : "var(--grad)",
              border:"none", borderRadius:8,
              color: inLib ? "#fff" : "#000",
              fontSize:"0.76rem", fontWeight:700,
              cursor: inLib ? "default" : "pointer",
              opacity: adding === watchKey ? 0.6 : 1,
              letterSpacing:"0.3px",
            }}
          >
            {adding === watchKey ? "Adding..." : inLib ? "In Library" : "+ Watchlist"}
          </button>

          {/* Mark Watched */}
          <button
            onClick={() => !inLib && onQuickAdd(item, type, "watched")}
            disabled={isAdding || inLib}
            style={{
              width:"100%", padding:"8px 0",
              background:"rgba(16,185,129,0.88)",
              border:"none", borderRadius:8,
              color:"#000", fontSize:"0.76rem", fontWeight:700,
              cursor: inLib ? "default" : "pointer",
              opacity: adding === watchedKey ? 0.6 : 1,
              letterSpacing:"0.3px",
            }}
          >
            {adding === watchedKey ? "Adding..." : type === "tv" ? "Mark Finished" : "Mark Watched"}
          </button>
        </div>
      </div>

      {/* Card info */}
      <div className="browse-info">
        <div className="browse-title" title={title}>{title}</div>
        <div className="browse-meta">{year}</div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { movies, addMovie }           = useMovies();
  const [tab,         setTab]          = useState("movies");
  const [browseItems, setBrowseItems]  = useState([]);
  const [loading,     setLoading]      = useState(false);
  const [genre,       setGenre]        = useState("all");
  const [sortBy,      setSortBy]       = useState("popularity.desc");
  const [page,        setPage]         = useState(1);
  const [totalPages,  setTotalPages]   = useState(1);
  const [selected,    setSelected]     = useState(null);
  const [selectedType,setSelectedType] = useState("movie");
  const [adding,      setAdding]       = useState(null);

  useEffect(() => {
    if (tab === "mylibrary") return;
    (async () => {
      setLoading(true); setBrowseItems([]);
      const params = { sort_by:sortBy, page, "vote_count.gte":100 };
      if (genre !== "all") params.with_genres = genre;
      const data = await fetchPopular(tab === "tv" ? "tv" : "movie", params);
      if (data?.results) { setBrowseItems(data.results); setTotalPages(Math.min(data.total_pages,20)); }
      setLoading(false);
    })();
  }, [tab, genre, sortBy, page]);

  const handleTab   = (t) => { setTab(t); setPage(1); setGenre("all"); setSortBy("popularity.desc"); };
  const alreadyAdded = (id, type) => movies.some(m => m.tmdbId === id && m.type === type);

  // Quick add from hover buttons — directly sets status without popup
  const handleQuickAdd = useCallback(async (item, type, status) => {
    const key = item.id + type + (status === "watched" ? "watched" : "");
    if (alreadyAdded(item.id, type)) return;
    setAdding(key);
    try {
      const title    = type === "tv" ? item.name  : item.title;
      const year     = type === "tv" ? item.first_air_date?.split("-")[0] : item.release_date?.split("-")[0];
      await addMovie({
        tmdbId: item.id, title, type,
        year: year || "",
        poster: item.poster_path ? posterUrl(item.poster_path) : "",
        overview: item.overview || "",
        genre: "Other",
        status,
        rating: 0, review: "",
        totalSeasons:    item.number_of_seasons  || null,
        totalEpisodes:   item.number_of_episodes || null,
        watchedEpisodes: 0, currentSeason: 1,
      });
    } catch (_) {}
    setAdding(null);
  }, [movies, addMovie]);

  // Hero quick add
  const handleHeroAdd = useCallback(async (item, status) => {
    if (alreadyAdded(item.id, "movie")) return;
    setAdding("hero");
    try {
      await addMovie({
        tmdbId: item.id, title: item.title, type: "movie",
        year: item.release_date?.split("-")[0] || "",
        poster: item.poster_path ? posterUrl(item.poster_path) : "",
        overview: item.overview || "",
        genre: "Other", status, rating: 0, review: "",
      });
    } catch (_) {}
    setAdding(null);
  }, [movies, addMovie]);

  return (
    <>
      {tab === "movies" && <HeroSection onAddToList={handleHeroAdd} />}

      <div className="page-body">
        <div className="page-header" style={{ marginBottom:16 }}>
          <div className="page-title">Discover</div>
          <div className="page-subtitle">
            Hover any poster — add to Watchlist or mark as Watched instantly
          </div>
        </div>

        <SearchBar />

        {/* Tabs */}
        <div className="browse-tabs">
          {[
            { key:"movies",    label:"Movies" },
            { key:"tv",        label:"TV Shows" },
            { key:"mylibrary", label:`My Library (${movies.length})` },
          ].map(({ key, label }) => (
            <button key={key} className={`browse-tab ${tab===key?"active":""}`} onClick={() => handleTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* My Library */}
        {tab === "mylibrary" && (
          <MovieGrid movies={movies} emptyTitle="Your library is empty"
            emptyText="Browse Movies or TV Shows and hover any poster to add!" />
        )}

        {/* Browse */}
        {tab !== "mylibrary" && (
          <>
            <div className="browse-filters">
              <select className="browse-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="genre-filter-row">
                {GENRES.map(g => (
                  <button key={g.id} className={`genre-filter-pill ${genre==g.id?"active":""}`}
                    onClick={() => { setGenre(g.id); setPage(1); }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="browse-loading">
                {[...Array(12)].map((_,i) => (
                  <div key={i} className="browse-skeleton" style={{ animationDelay:`${i*0.05}s` }} />
                ))}
              </div>
            ) : (
              <div className="browse-grid">
                {browseItems.map(item => {
                  const type = tab === "tv" ? "tv" : "movie";
                  return (
                    <BrowseCard
                      key={item.id}
                      item={item}
                      type={type}
                      inLib={alreadyAdded(item.id, type)}
                      adding={adding}
                      onQuickAdd={handleQuickAdd}
                      onDetails={(i, t) => { setSelected(i); setSelectedType(t); }}
                    />
                  );
                })}
              </div>
            )}

            {!loading && browseItems.length === 0 && (
              <div className="empty">
                <div className="empty-title">No results found</div>
                <div className="empty-sub">Try a different genre or sort option</div>
              </div>
            )}

            {totalPages > 1 && !loading && browseItems.length > 0 && (
              <div className="browse-pagination">
                <button className="btn btn-ghost btn-sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
                <span style={{ color:"var(--text2)", fontSize:"0.88rem" }}>Page {page} of {totalPages}</span>
                <button className="btn btn-ghost btn-sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full detail popup — only when "View Details" clicked */}
      {selected && (
        <BrowseDetailPopup item={selected} type={selectedType} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
