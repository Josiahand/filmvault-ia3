import { useState } from "react";
import StarRating from "./StarRating";
import MovieModal from "./MovieModal";

export default function MovieGrid({ movies, emptyIcon="🎬", emptyTitle="Nothing here yet", emptyText="Search above to add movies" }) {
  const [selected, setSelected] = useState(null);

  if (movies.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">{emptyIcon}</div>
        <div className="empty-title">{emptyTitle}</div>
        <div className="empty-sub">{emptyText}</div>
      </div>
    );
  }

  return (
    <>
      <div className="movies-grid">
        {movies.map((movie, i) => {
          const isTV = movie.type === "tv";
          const progress = isTV && movie.totalEpisodes > 0
            ? Math.round((movie.watchedEpisodes / movie.totalEpisodes) * 100) : 0;

          return (
            <div key={movie._id} className="movie-card" style={{ animationDelay:`${i*0.04}s` }} onClick={() => setSelected(movie)}>
              <div className="card-poster-wrap">
                {movie.poster
                  ? <img className="card-poster" src={movie.poster} alt={movie.title} loading="lazy" />
                  : <div className="card-poster-placeholder">{isTV ? "📺" : "🎬"}</div>
                }
                <div className="card-overlay">
                  <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); setSelected(movie); }} style={{ fontSize:"0.72rem" }}>✏️ Edit</button>
                </div>

                {/* Type badge */}
                <span style={{ position:"absolute", top:8, left:8, fontSize:"0.62rem", fontWeight:700, padding:"2px 7px", borderRadius:20, background: isTV ? "rgba(88,166,255,0.88)" : "rgba(240,165,0,0.88)", color:"#000" }}>
                  {isTV ? "📺 TV" : "🎬 Film"}
                </span>

                {/* Status badge */}
                <span className={"status-pill " + (movie.status==="watched" ? "pill-watched" : movie.status==="watching" ? "pill-watching" : "pill-watchlist")} style={{ top:30 }}>
                  {movie.status==="watched" ? "✅ Done" : movie.status==="watching" ? "▶️ Watching" : "⏳ List"}
                </span>

                {/* TV Progress bar */}
                {isTV && movie.totalEpisodes > 0 && movie.status === "watching" && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, height:4, background:"rgba(0,0,0,0.5)" }}>
                    <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,var(--accent),var(--accent2))" }} />
                  </div>
                )}
              </div>

              <div className="card-info">
                <div className="card-title" title={movie.title}>{movie.title}</div>
                <div className="card-meta">
                  <span className="card-genre">
                    {movie.genre}{movie.year ? ` · ${movie.year}` : ""}
                    {isTV && movie.totalSeasons ? ` · S${movie.currentSeason || 1}` : ""}
                  </span>
                  {movie.rating > 0 && <StarRating value={movie.rating} readOnly />}
                </div>
                {isTV && movie.totalEpisodes > 0 && (
                  <div style={{ fontSize:"0.68rem", color:"var(--text3)", marginTop:3 }}>
                    {movie.watchedEpisodes}/{movie.totalEpisodes} eps · {progress}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && <MovieModal movie={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
