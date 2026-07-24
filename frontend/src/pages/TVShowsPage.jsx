import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { posterUrl } from "../utils/tmdb";

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY || "0ca631e5b6da1c2581df9bc13a674c86";
const TMDB_BASE = "https://api.themoviedb.org/3";

const TV_GENRE_MAP = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics", 37: "Western",
};

async function fetchTMDb(endpoint, params = {}) {
  if (!TMDB_KEY || TMDB_KEY === "your_tmdb_key_here") return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.json();
}

// ── HORIZONTAL TV ROW ─────────────────────────────────────────
function TVRow({ label, accentLabel, endpoint, params = {}, onOpenPopup }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchTMDb(endpoint, { ...params, page: 1 })
      .then(data => {
        const results = (data?.results || []).filter(m => m.poster_path).slice(0, 20);
        setItems(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [endpoint]);

  const scroll = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 800, behavior: "smooth" });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="movie-row">
      <div className="row-header">
        <h2 className="row-title">
          {label} <span className="row-title-accent">{accentLabel}</span>
        </h2>
        <div className="row-arrows">
          <button className="row-arrow" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
          <button className="row-arrow" onClick={() => scroll(1)}  aria-label="Scroll right">›</button>
        </div>
      </div>
      <div className="row-scroll" ref={scrollRef}>
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="row-card-skeleton" style={{ animationDelay: `${i * 0.05}s` }} />
            ))
          : items.map(show => {
              const title  = show.name || show.title || "";
              const rating = show.vote_average?.toFixed(1) ?? "–";
              return (
                <div
                  key={show.id}
                  className="row-card"
                  onClick={() => onOpenPopup(show, "tv")}
                  title={title}
                >
                  <div className="row-card-poster-wrap">
                    <img
                      src={posterUrl(show.poster_path, "w342")}
                      alt={title}
                      className="row-card-poster"
                      loading="lazy"
                    />
                    <div className="row-card-hover-overlay">
                      <div className="row-card-play-btn">▶</div>
                    </div>
                    <div className="row-card-rating-badge">⭐ {rating}</div>
                  </div>
                  <div className="row-card-title">{title}</div>
                </div>
              );
            })
        }
      </div>
    </section>
  );
}

// ── TV SHOWS PAGE HERO ────────────────────────────────────────
function TVHero({ onOpenPopup }) {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    fetchTMDb("/tv/popular", { page: 1 }).then(data => {
      const picks = (data?.results || []).filter(s => s.backdrop_path);
      if (picks.length > 0) setFeatured(picks[Math.floor(Math.random() * Math.min(picks.length, 5))]);
    });
  }, []);

  if (!featured) return <div className="hero-banner hero-banner-skeleton" style={{ height: 340 }} />;

  const year   = featured.first_air_date?.split("-")[0];
  const rating = featured.vote_average?.toFixed(1);
  const genres = (featured.genre_ids || []).slice(0, 3).map(id => TV_GENRE_MAP[id]).filter(Boolean);

  return (
    <div className="hero-banner" style={{ height: 360 }}>
      <div className="hero-backdrop">
        <img
          src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
          alt={featured.name}
          className="hero-backdrop-img"
        />
        <div className="hero-grad-left" />
        <div className="hero-grad-bottom" />
      </div>
      <div className="hero-info" style={{ paddingBottom: 36 }}>
        {genres.length > 0 && (
          <div className="hero-genre-tags">
            {genres.map(g => <span key={g} className="hero-genre-tag">{g}</span>)}
          </div>
        )}
        <h1 className="hero-movie-title" style={{ fontSize: "3rem" }}>{featured.name}</h1>
        <div className="hero-movie-meta">
          <span className="hero-rating-badge">⭐ {rating}</span>
          {year && <span className="hero-year-badge">{year}</span>}
        </div>
        <div className="hero-cta">
          <button className="hero-btn-primary" onClick={() => onOpenPopup(featured, "tv")}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            Add to Watchlist
          </button>
          <button className="hero-btn-secondary" onClick={() => onOpenPopup(featured, "tv")}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN TV SHOWS PAGE ────────────────────────────────────────
export default function TVShowsPage() {
  const navigate = useNavigate();

  const openPopup = (item, type) => {
    const resolvedType = type || item.media_type || item.type || (item.name && !item.title ? "tv" : "movie");
    const tmdbId = item.id || item.tmdbId;
    if (resolvedType === "tv") {
      navigate(`/tv/${tmdbId}`);
    } else {
      navigate(`/movie/${tmdbId}`);
    }
  };

  return (
    <>
      <TVHero onOpenPopup={openPopup} />

      <div className="rows-container">
        <TVRow
          label="Popular"      accentLabel="TV Shows"
          endpoint="/tv/popular"
          onOpenPopup={openPopup}
        />
        <TVRow
          label="Top"          accentLabel="Rated"
          endpoint="/tv/top_rated"
          onOpenPopup={openPopup}
        />
        <TVRow
          label="Trending"     accentLabel="This Week"
          endpoint="/trending/tv/week"
          onOpenPopup={openPopup}
        />
        <TVRow
          label="Airing"       accentLabel="Today"
          endpoint="/tv/airing_today"
          onOpenPopup={openPopup}
        />
        <TVRow
          label="On The"       accentLabel="Air"
          endpoint="/tv/on_the_air"
          onOpenPopup={openPopup}
        />
        <TVRow
          label="Drama"        accentLabel="Series"
          endpoint="/discover/tv"
          params={{ with_genres: "18", sort_by: "popularity.desc" }}
          onOpenPopup={openPopup}
        />
      </div>
    </>
  );
}
