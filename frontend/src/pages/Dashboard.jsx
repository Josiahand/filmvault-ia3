import { useState, useEffect } from "react";
import { useMovies } from "../context/MovieContext";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";
import BrowseDetailPopup from "../components/BrowseDetailPopup";
import { posterUrl } from "../utils/tmdb";

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const GENRES = [
  { id:"all", name:"All" },
  { id:28,    name:"Action" },
  { id:35,    name:"Comedy" },
  { id:18,    name:"Drama" },
  { id:27,    name:"Horror" },
  { id:878,   name:"Sci-Fi" },
  { id:10749, name:"Romance" },
  { id:16,    name:"Animation" },
  { id:80,    name:"Crime" },
  { id:99,    name:"Documentary" },
  { id:14,    name:"Fantasy" },
  { id:53,    name:"Thriller" },
];

const SORT_OPTIONS = [
  { value:"popularity.desc",   label:"Most Popular" },
  { value:"vote_average.desc", label:"Top Rated"    },
  { value:"release_date.desc", label:"Newest First" },
  { value:"revenue.desc",      label:"Box Office"   },
];

async function fetchTMDb(endpoint, params={}) {
  if (!TMDB_KEY || TMDB_KEY === "your_tmdb_key_here") return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("append_to_response", "credits");
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url);
  return res.json();
}

export default function Dashboard() {
  const { movies }                        = useMovies();
  const [tab,         setTab]             = useState("movies");
  const [browseItems, setBrowseItems]     = useState([]);
  const [loading,     setLoading]         = useState(false);
  const [genre,       setGenre]           = useState("all");
  const [sortBy,      setSortBy]          = useState("popularity.desc");
  const [page,        setPage]            = useState(1);
  const [totalPages,  setTotalPages]      = useState(1);
  const [selected,    setSelected]        = useState(null); // item for popup
  const [selectedType,setSelectedType]    = useState("movie");

  useEffect(() => {
    if (tab === "mylibrary") return;
    fetchBrowse();
  }, [tab, genre, sortBy, page]);

  const fetchBrowse = async () => {
    setLoading(true);
    setBrowseItems([]);
    const endpoint = tab === "tv" ? "/discover/tv" : "/discover/movie";
    const params   = { sort_by: sortBy, page, "vote_count.gte": 100 };
    if (genre !== "all") params.with_genres = genre;
    const data = await fetchTMDb(endpoint, params);
    if (data?.results) {
      setBrowseItems(data.results);
      setTotalPages(Math.min(data.total_pages, 20));
    }
    setLoading(false);
  };

  const handleTab   = (t) => { setTab(t); setPage(1); setGenre("all"); setSortBy("popularity.desc"); };
  const handleGenre = (g) => { setGenre(g); setPage(1); };
  const handleSort  = (s) => { setSortBy(s); setPage(1); };

  const openPopup = (item, type) => { setSelected(item); setSelectedType(type); };

  const alreadyAdded = (id, type) => movies.some(m => m.tmdbId === id && m.type === type);

  return (
    <>
      <div className="page-header" style={{ marginBottom:16 }}>
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Browse, discover, and manage your collection</div>
      </div>

      <SearchBar />

      {/* Tabs */}
      <div className="browse-tabs">
        {[
          { key:"movies",    label:"🎬 Movies" },
          { key:"tv",        label:"📺 TV Shows" },
          { key:"mylibrary", label:`📚 My Library (${movies.length})` },
        ].map(({ key, label }) => (
          <button key={key} className={"browse-tab " + (tab===key ? "active" : "")} onClick={() => handleTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* My Library */}
      {tab === "mylibrary" && (
        <MovieGrid
          movies={movies}
          emptyIcon="🎬"
          emptyTitle="Your library is empty"
          emptyText="Browse Movies or TV Shows tabs and click any poster to add!"
        />
      )}

      {/* Browse */}
      {tab !== "mylibrary" && (
        <>
          {/* Filters */}
          <div className="browse-filters">
            <select className="browse-select" value={sortBy} onChange={e => handleSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="genre-filter-row">
              {GENRES.map(g => (
                <button key={g.id} className={"genre-filter-pill " + (genre==g.id ? "active":"")} onClick={() => handleGenre(g.id)}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="browse-loading">
              {[...Array(12)].map((_,i) => <div key={i} className="browse-skeleton" style={{ animationDelay:`${i*0.05}s` }} />)}
            </div>
          ) : (
            <div className="browse-grid">
              {browseItems.map(item => {
                const type      = tab === "tv" ? "tv" : "movie";
                const title     = type === "tv" ? item.name  : item.title;
                const year      = type === "tv" ? item.first_air_date?.split("-")[0] : item.release_date?.split("-")[0];
                const score     = Math.round((item.vote_average || 0) * 10);
                const scoreColor= score >= 75 ? "var(--green)" : score >= 50 ? "var(--accent)" : "var(--red)";
                const inLib     = alreadyAdded(item.id, type);

                return (
                  <div key={item.id} className="browse-card" onClick={() => openPopup(item, type)}>
                    <div className="browse-poster-wrap">
                      {item.poster_path
                        ? <img className="browse-poster" src={posterUrl(item.poster_path)} alt={title} loading="lazy" />
                        : <div className="browse-poster-placeholder">{type==="tv" ? "📺":"🎬"}</div>
                      }

                      {/* Score */}
                      <div className="browse-score" style={{ borderColor:scoreColor, color:scoreColor }}>
                        {score}<span style={{ fontSize:"0.55rem" }}>%</span>
                      </div>

                      {/* In library badge */}
                      {inLib && (
                        <div style={{ position:"absolute", top:8, right:8, background:"rgba(63,185,80,0.9)", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.85rem" }}>✓</div>
                      )}

                      {/* Hover overlay */}
                      <div className="browse-overlay">
                        <div style={{ width:"100%", textAlign:"center", color:"white", fontSize:"0.82rem", fontWeight:600, padding:"4px 8px", background:"rgba(240,165,0,0.15)", borderRadius:6, border:"1px solid rgba(240,165,0,0.3)" }}>
                          {inLib ? "✏️ Edit in Library" : "🔍 View Details"}
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

          {/* No key message */}
          {!loading && browseItems.length === 0 && (
            <div className="empty">
              <div className="empty-icon">🔑</div>
              <div className="empty-title">TMDb API Key needed</div>
              <div className="empty-sub">Add VITE_TMDB_API_KEY to frontend .env to browse</div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && browseItems.length > 0 && (
            <div className="browse-pagination">
              <button className="btn btn-ghost btn-sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>← Prev</button>
              <span style={{ color:"var(--text2)", fontSize:"0.88rem" }}>Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Detail Popup */}
      {selected && (
        <BrowseDetailPopup
          item={selected}
          type={selectedType}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
