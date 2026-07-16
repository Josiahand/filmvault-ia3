import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchAll, posterUrl } from "../utils/tmdb";
import { useMovies } from "../context/MovieContext";

export default function SearchBar() {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const { movies }                = useMovies();
  const wrapRef = useRef();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setResults([]);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
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

  // Click on result → navigate to detail page
  const handleClick = (r) => {
    setResults([]);
    setQuery("");
    if (r.mediaType === "tv") {
      navigate(`/tv/${r.id}`);
    } else {
      navigate(`/movie/${r.id}`);
    }
  };

  const alreadyIn = (r) => movies.some(m => m.tmdbId === r.id && m.type === r.mediaType);

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          className="search-field"
          placeholder="Search movies & TV shows…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {(results.length > 0 || searching) && (
        <div className="search-dropdown">
          {searching && (
            <div className="search-status">Searching TMDb…</div>
          )}

          {!searching && results.length === 0 && (
            <div className="search-status">No results found</div>
          )}

          {!searching && results.map(r => {
            const inLib = alreadyIn(r);
            const isTV  = r.mediaType === "tv";
            return (
              <div
                key={`${r.mediaType}-${r.id}`}
                className="search-result-item"
                onClick={() => handleClick(r)}
              >
                {r.poster_path ? (
                  <img
                    src={posterUrl(r.poster_path, "w92")}
                    alt={r.title}
                    className="search-result-poster"
                  />
                ) : (
                  <div className="search-result-poster-placeholder">
                    {isTV ? "📺" : "🎬"}
                  </div>
                )}

                <div className="search-result-info">
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-meta">
                    <span style={{
                      color: isTV ? "#58A6FF" : "var(--accent)",
                      fontWeight: 700,
                    }}>
                      {isTV ? "📺 TV Show" : "🎬 Movie"}
                    </span>
                    {r.year && ` · ${r.year}`}
                    {r.vote_average > 0 && ` · ⭐ ${r.vote_average.toFixed(1)}`}
                  </div>
                </div>

                {inLib && (
                  <span className="search-result-in-lib">✓ Saved</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
