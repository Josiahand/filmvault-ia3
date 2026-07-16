import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { posterUrl } from "../utils/tmdb";

const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 18: "Drama", 14: "Fantasy", 27: "Horror",
  10749: "Romance", 878: "Sci-Fi", 53: "Thriller", 99: "Documentary",
};

async function fetchTMDb(endpoint, params = {}) {
  if (!TMDB_KEY || TMDB_KEY === "your_tmdb_key_here") return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.json();
}

// ── CINEMATIC HERO BANNER ─────────────────────────────────────
function HeroBanner({ onOpenPopup }) {
  const [slides,  setSlides]  = useState([]);
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchTMDb("/movie/popular", { page: 1 }).then(data => {
      const picks = (data?.results || []).filter(m => m.backdrop_path).slice(0, 5);
      setSlides(picks);
    });
  }, []);

  const goTo = useCallback((idx, slidesLen) => {
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 350);
    // Reset timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setCurrent(prev => (prev + 1) % slidesLen); setFading(false); }, 350);
    }, 6000);
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    intervalRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setCurrent(prev => (prev + 1) % slides.length); setFading(false); }, 350);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div className="hero-banner hero-banner-skeleton" />;
  }

  const movie  = slides[current];
  const year   = movie.release_date?.split("-")[0];
  const rating = movie.vote_average?.toFixed(1);
  const genres = (movie.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean);

  return (
    <div className="hero-banner">
      {/* Backdrop */}
      <div className={`hero-backdrop ${fading ? "hero-backdrop--fading" : ""}`}>
        <img
          key={movie.id}
          src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
          alt={movie.title}
          className="hero-backdrop-img"
        />
        <div className="hero-grad-left" />
        <div className="hero-grad-bottom" />
      </div>

      {/* Content */}
      <div className="hero-info">
        {genres.length > 0 && (
          <div className="hero-genre-tags">
            {genres.map(g => <span key={g} className="hero-genre-tag">{g}</span>)}
          </div>
        )}
        <h1 className="hero-movie-title">{movie.title}</h1>
        <div className="hero-movie-meta">
          <span className="hero-rating-badge">⭐ {rating}</span>
          {year && <span className="hero-year-badge">{year}</span>}
        </div>
        {movie.overview && (
          <p className="hero-movie-overview">{movie.overview}</p>
        )}
        <div className="hero-cta">
          <button
            className="hero-btn-primary"
            onClick={() => onOpenPopup(movie, "movie")}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
            </svg>
            Add to Watchlist
          </button>
          <button
            className="hero-btn-secondary"
            onClick={() => onOpenPopup(movie, "movie")}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* Slide dots */}
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? "hero-dot--active" : ""}`}
            onClick={() => goTo(i, slides.length)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── HORIZONTAL MOVIE ROW ──────────────────────────────────────
function MovieRow({ label, accentLabel, endpoint, params = {}, onOpenPopup }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    fetchTMDb(endpoint, { ...params, page: 1 }).then(data => {
      const results = (data?.results || []).filter(m => m.poster_path).slice(0, 20);
      setItems(results);
      setLoading(false);
    });
  }, [endpoint]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 800, behavior: "smooth" });
    }
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
          : items.map(movie => {
              const title  = movie.title || movie.name || "";
              const rating = movie.vote_average?.toFixed(1) ?? "–";
              return (
                <div
                  key={movie.id}
                  className="row-card"
                  onClick={() => onOpenPopup(movie, "movie")}
                  title={title}
                >
                  <div className="row-card-poster-wrap">
                    <img
                      src={posterUrl(movie.poster_path, "w342")}
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

// ── MAIN DASHBOARD ────────────────────────────────────────────
export default function Dashboard() {
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
      <HeroBanner onOpenPopup={openPopup} />

      <div className="rows-container">
        <MovieRow
          label="Recommended" accentLabel="For You"
          endpoint="/discover/movie"
          params={{ sort_by: "vote_average.desc", "vote_count.gte": 1000 }}
          onOpenPopup={openPopup}
        />
        <MovieRow
          label="Trending"    accentLabel="Now"
          endpoint="/trending/movie/week"
          onOpenPopup={openPopup}
        />
        <MovieRow
          label="Popular"     accentLabel="Movies"
          endpoint="/movie/popular"
          onOpenPopup={openPopup}
        />
        <MovieRow
          label="Top"         accentLabel="Rated"
          endpoint="/movie/top_rated"
          onOpenPopup={openPopup}
        />
        <MovieRow
          label="New"         accentLabel="Releases"
          endpoint="/movie/now_playing"
          onOpenPopup={openPopup}
        />
      </div>
    </>
  );
}
