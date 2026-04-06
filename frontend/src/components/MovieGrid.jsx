import { useState } from "react";
import StarRating from "./StarRating";
import MovieModal from "./MovieModal";

export default function MovieGrid({
  movies,
  emptyIcon  = null,
  emptyTitle = "Nothing here yet",
  emptyText  = "Search above to add movies",
}) {
  const [selected, setSelected] = useState(null);

  if (movies.length === 0) {
    return (
      <div className="empty">
        {emptyIcon && <div className="empty-icon">{emptyIcon}</div>}
        <div className="empty-title">{emptyTitle}</div>
        <div className="empty-sub">{emptyText}</div>
      </div>
    );
  }

  return (
    <>
      <div className="movies-grid">
        {movies.map((movie, i) => {
          const isTV     = movie.type === "tv";
          const progress = isTV && movie.totalEpisodes > 0
            ? Math.round((movie.watchedEpisodes / movie.totalEpisodes) * 100)
            : 0;

          // Status label — no emojis
          const statusLabel =
            movie.status === "watched"  ? "Watched"  :
            movie.status === "watching" ? "Watching" : "Watchlist";

          const statusClass =
            movie.status === "watched"  ? "pill-watched"  :
            movie.status === "watching" ? "pill-watching" : "pill-watchlist";

          return (
            <div
              key={movie._id}
              className="movie-card"
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => setSelected(movie)}
            >
              <div className="card-poster-wrap">
                {movie.poster ? (
                  <img className="card-poster" src={movie.poster} alt={movie.title} loading="lazy" />
                ) : (
                  <div className="card-poster-placeholder" style={{ fontSize:"0.8rem", fontWeight:700, color:"var(--text3)" }}>
                    {isTV ? "TV" : "FILM"}
                  </div>
                )}

                {/* Hover overlay */}
                <div className="card-overlay">
                  <button
                    className="btn btn-ghost btn-xs"
                    style={{ fontSize:"0.72rem" }}
                    onClick={e => { e.stopPropagation(); setSelected(movie); }}
                  >
                    Edit
                  </button>
                </div>

                {/* Type badge */}
                <span style={{
                  position:"absolute", top:8, left:8,
                  fontSize:"0.6rem", fontWeight:700,
                  padding:"2px 7px", borderRadius:20,
                  background: isTV ? "rgba(139,92,246,0.88)" : "rgba(236,72,153,0.88)",
                  color:"#fff",
                }}>
                  {isTV ? "TV" : "Film"}
                </span>

                {/* Status badge */}
                <span className={"status-pill " + statusClass} style={{ top: 30 }}>
                  {statusLabel}
                </span>

                {/* TV progress bar */}
                {isTV && movie.totalEpisodes > 0 && movie.status === "watching" && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, height:4, background:"rgba(0,0,0,0.5)" }}>
                    <div style={{ height:"100%", width:`${progress}%`, background:"var(--grad)" }} />
                  </div>
                )}
              </div>

              <div className="card-info">
                <div className="card-title" title={movie.title}>{movie.title}</div>
                <div className="card-meta">
                  <span className="card-genre">
                    {movie.genre}
                    {movie.year ? ` · ${movie.year}` : ""}
                    {isTV && movie.totalSeasons  ? ` · ${movie.totalSeasons}S` : ""}
                  </span>
                  {movie.rating > 0 && <StarRating value={movie.rating} readOnly />}
                </div>
                {/* TV seasons & episodes */}
                {isTV && (movie.totalSeasons || movie.totalEpisodes) && (
                  <div style={{ fontSize:"0.68rem", color:"var(--text3)", marginTop:3 }}>
                    {[
                      movie.totalSeasons  ? `${movie.totalSeasons} Season${movie.totalSeasons !== 1 ? "s" : ""}` : null,
                      movie.totalEpisodes ? `${movie.totalEpisodes} Episodes` : null,
                    ].filter(Boolean).join(" · ")}
                  </div>
                )}
                {/* Episode progress */}
                {isTV && movie.totalEpisodes > 0 && movie.status === "watching" && (
                  <div style={{ fontSize:"0.68rem", color:"var(--accent)", marginTop:2 }}>
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
