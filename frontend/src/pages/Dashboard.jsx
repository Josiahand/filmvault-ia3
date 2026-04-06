import { useState, useEffect } from "react";
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

// fetchPopular imported from utils/tmdb.js

// ── HERO SECTION ─────────────────────────────────────────────────────────────
function HeroSection({ movies, onAddToList }) {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    fetchPopular("movie", { sort_by:"popularity.desc", page:1, "vote_count.gte":100 })
      .then(data => {
        const picks = (data?.results || []).filter(m => m.backdrop_path);
        if (picks.length) setHero(picks[Math.floor(Math.random() * Math.min(5, picks.length))]);
      })
      .catch(() => {});
  }, []);

  if (!hero) return null;

  const score = Math.round((hero.vote_average || 0) * 10);
  const year  = hero.release_date?.split("-")[0];

  return (
    <div className="hero-section">
      <div className="hero-bg" />
      {hero.backdrop_path && (
        <img
          className="hero-bg-image"
          src={`https://image.tmdb.org/t/p/w1280${hero.backdrop_path}`}
          alt={hero.title}
        />
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
        {hero.overview && (
          <div className="hero-overview">{hero.overview}</div>
        )}
        <div className="hero-actions">
          <button
            className="hero-watch-btn"
            onClick={() => onAddToList(hero)}
          >
            Add to My List
          </button>
          <button className="hero-add-btn" onClick={() => onAddToList(hero)}>
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { movies }                      = useMovies();
  const [tab,         setTab]           = useState("movies");
  const [browseItems, setBrowseItems]   = useState([]);
  const [loading,     setLoading]       = useState(false);
  const [genre,       setGenre]         = useState("all");
  const [sortBy,      setSortBy]        = useState("popularity.desc");
  const [page,        setPage]          = useState(1);
  const [totalPages,  setTotalPages]    = useState(1);
  const [selected,    setSelected]      = useState(null);
  const [selectedType,setSelectedType]  = useState("movie");

  useEffect(() => {
    if (tab === "mylibrary") return;
    fetchBrowse();
  }, [tab, genre, sortBy, page]);

  const fetchBrowse = async () => {
    setLoading(true); setBrowseItems([]);
    const params = { sort_by: sortBy, page, "vote_count.gte": 100 };
    if (genre !== "all") params.with_genres = genre;
    const data = await fetchPopular(tab === "tv" ? "tv" : "movie", params);
    if (data?.results) { setBrowseItems(data.results); setTotalPages(Math.min(data.total_pages, 20)); }
    setLoading(false);
  };

  const handleTab   = (t) => { setTab(t); setPage(1); setGenre("all"); setSortBy("popularity.desc"); };
  const handleGenre = (g) => { setGenre(g); setPage(1); };
  const handleSort  = (s) => { setSortBy(s); setPage(1); };
  const openPopup   = (item, type) => { setSelected(item); setSelectedType(type); };
  const alreadyAdded = (id, type) => movies.some(m => m.tmdbId === id && m.type === type);

  return (
    <>
      {/* ── HERO (only on movies tab) ── */}
      {tab === "movies" && (
        <HeroSection
          movies={movies}
          onAddToList={(item) => openPopup(item, "movie")}
        />
      )}

      <div className="page-body">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div className="page-title">Discover</div>
          <div className="page-subtitle">Browse and add movies & TV shows to your collection</div>
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
          <MovieGrid
            movies={movies}
            emptyIcon={null}
            emptyTitle="Your library is empty"
            emptyText="Browse Movies or TV Shows and click any poster to add!"
          />
        )}

        {/* Browse */}
        {tab !== "mylibrary" && (
          <>
            <div className="browse-filters">
              <select className="browse-select" value={sortBy} onChange={e => handleSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="genre-filter-row">
                {GENRES.map(g => (
                  <button key={g.id} className={`genre-filter-pill ${genre==g.id?"active":""}`} onClick={() => handleGenre(g.id)}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="browse-loading">
                {[...Array(12)].map((_,i) => <div key={i} className="browse-skeleton" style={{ animationDelay:`${i*0.05}s` }} />)}
              </div>
            ) : (
              <div className="browse-grid">
                {browseItems.map(item => {
                  const type   = tab === "tv" ? "tv" : "movie";
                  const title  = type === "tv" ? item.name  : item.title;
                  const year   = type === "tv" ? item.first_air_date?.split("-")[0] : item.release_date?.split("-")[0];
                  const score  = Math.round((item.vote_average || 0) * 10);
                  const scoreColor = score >= 75 ? "var(--green)" : score >= 50 ? "var(--accent)" : "var(--red)";
                  const inLib  = alreadyAdded(item.id, type);

                  return (
                    <div key={item.id} className="browse-card" onClick={() => openPopup(item, type)}>
                      <div className="browse-poster-wrap">
                        {item.poster_path
                          ? <img className="browse-poster" src={posterUrl(item.poster_path)} alt={title} loading="lazy" />
                          : <div className="browse-poster-placeholder">{""}</div>
                        }
                        <div className="browse-score" style={{ borderColor:scoreColor, color:scoreColor }}>
                          {score}<span style={{ fontSize:"0.5rem" }}>%</span>
                        </div>
                        {inLib && (
                          <div style={{ position:"absolute", top:8, right:8, background:"rgba(16,185,129,0.9)", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.85rem" }}>"In Library"</div>
                        )}
                        <div className="browse-overlay">
                          <div style={{ width:"100%", textAlign:"center", color:"white", fontSize:"0.8rem", fontWeight:600, padding:"5px 8px", background:"rgba(245,158,11,0.15)", borderRadius:"8px", border:"1px solid rgba(245,158,11,0.3)", backdropFilter:"blur(8px)" }}>
                            {inLib ? "Edit" : "Details"}
                          </div>
                        </div>
                      </div>
                      <div className="browse-info">
                        <div className="browse-title" title={title}>{title}</div>
                        <div className="browse-meta">{year}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && browseItems.length === 0 && (
              <div className="empty">
                
                <div className="empty-title">TMDb API Key needed</div>
                <div className="empty-sub">Add VITE_TMDB_API_KEY to frontend .env to browse</div>
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

      {selected && (
        <BrowseDetailPopup item={selected} type={selectedType} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
