import { useState, useEffect, useRef } from "react";
import { searchAll, posterUrl } from "../utils/tmdb";
import { useMovies } from "../context/MovieContext";

export default function SearchBar() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding]     = useState(null);
  const { addMovie, movies }    = useMovies();
  const wrapRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setResults([]); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchAll(query);
      setResults(res);
      setSearching(false);
    }, 380);
    return () => clearTimeout(t);
  }, [query]);

  const handleAdd = async (r) => {
    const exists = movies.find(m => m.tmdbId === r.id && m.type === r.mediaType);
    if (exists) return;
    setAdding(r.id + r.mediaType);
    try {
      await addMovie({
        tmdbId:        r.id,
        title:         r.title,
        type:          r.mediaType || "movie",
        year:          r.year || r.release_date?.split("-")[0] || r.first_air_date?.split("-")[0] || "",
        poster:        r.poster_path ? posterUrl(r.poster_path) : "",
        overview:      r.overview || "",
        genre:         "Other",
        status:        "watchlist",
        rating:        0,
        review:        "",
        totalSeasons:  r.totalSeasons || null,
        totalEpisodes: r.totalEpisodes || null,
        watchedEpisodes: 0,
        currentSeason: 1,
      });
      setQuery(""); setResults([]);
    } catch (_) {}
    setAdding(null);
  };

  const alreadyIn = (r) => movies.some(m => m.tmdbId === r.id && m.type === r.mediaType);

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input className="search-field" placeholder="Search movies & TV shows…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      {(results.length > 0 || searching) && (
        <div className="search-results-dropdown">
          {searching && <div className="search-empty">Searching…</div>}
          {results.map((r) => {
            const inList = alreadyIn(r);
            const key = r.id + (r.mediaType || "movie");
            return (
              <div key={key} className="search-result-row">
                {r.poster_path
                  ? <img className="result-thumb" src={posterUrl(r.poster_path)} alt={r.title} />
                  : <div className="result-thumb">{r.mediaType === "tv" ? "📺" : "🎬"}</div>
                }
                <div className="result-info">
                  <div className="result-title">{r.title}</div>
                  <div className="result-year">
                    <span style={{ background: r.mediaType === "tv" ? "rgba(88,166,255,0.18)" : "rgba(240,165,0,0.18)", color: r.mediaType === "tv" ? "var(--blue)" : "var(--accent)", padding: "1px 7px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600, marginRight: 6 }}>
                      {r.mediaType === "tv" ? "📺 TV Show" : "🎬 Movie"}
                    </span>
                    {r.year}
                    {r.totalSeasons && ` · ${r.totalSeasons} seasons`}
                  </div>
                </div>
                <button className={"btn btn-xs " + (inList ? "btn-ghost" : "btn-primary")} onClick={() => !inList && handleAdd(r)} disabled={inList || adding === key} style={{ flexShrink: 0 }}>
                  {inList ? "✓ Added" : adding === key ? "…" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
