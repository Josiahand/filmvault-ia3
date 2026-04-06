import { useState, useEffect, useRef } from "react";
import { searchAll, posterUrl } from "../utils/tmdb";
import { useMovies } from "../context/MovieContext";
import BrowseDetailPopup from "./BrowseDetailPopup";

export default function SearchBar() {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [selType,   setSelType]   = useState("movie");
  const { movies }                = useMovies();
  const wrapRef = useRef();

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

  // Click on result → open detail popup
  const handleClick = (r) => {
    setSelected(r);
    setSelType(r.mediaType || "movie");
    setResults([]);
    setQuery("");
  };

  const alreadyIn = (r) => movies.some(m => m.tmdbId === r.id && m.type === r.mediaType);

  return (
    <>
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
          <div className="search-results-dropdown">
            {searching && <div className="search-empty">Searching…</div>}
            {results.map((r) => {
              const inLib = alreadyIn(r);
              const key   = r.id + (r.mediaType || "movie");
              return (
                <div
                  key={key}
                  className="search-result-row"
                  onClick={() => handleClick(r)}
                >
                  {r.poster_path ? (
                    <img className="result-thumb" src={posterUrl(r.poster_path)} alt={r.title} />
                  ) : (
                    <div className="result-thumb">{r.mediaType === "tv" ? "📺" : "🎬"}</div>
                  )}
                  <div className="result-info">
                    <div className="result-title">{r.title}</div>
                    <div className="result-year">
                      <span style={{
                        background: r.mediaType === "tv" ? "rgba(236,72,153,0.18)" : "rgba(236,72,153,0.18)",
                        color: "var(--accent)",
                        padding: "1px 8px",
                        borderRadius: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        marginRight: 6,
                      }}>
                        {r.mediaType === "tv" ? "📺 TV" : "🎬 Movie"}
                      </span>
                      {r.year}
                      {r.totalSeasons && ` · ${r.totalSeasons} seasons`}
                    </div>
                  </div>
                  {inLib && (
                    <span style={{ fontSize:"0.72rem", color:"var(--green)", fontWeight:700, flexShrink:0 }}>✓ Added</span>
                  )}
                  {!inLib && (
                    <span style={{ fontSize:"0.72rem", color:"var(--text3)", flexShrink:0 }}>Click to add →</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail popup opens when user clicks a result */}
      {selected && (
        <BrowseDetailPopup
          item={selected}
          type={selType}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
