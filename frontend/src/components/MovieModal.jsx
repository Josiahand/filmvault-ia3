import { useState } from "react";
import { useMovies } from "../context/MovieContext";
import StarRating from "./StarRating";

const GENRES = ["Action","Animation","Comedy","Crime","Documentary","Drama","Fantasy","Horror","Romance","Sci-Fi","Thriller","Other"];

export default function MovieModal({ movie, onClose }) {
  const { updateMovie, deleteMovie } = useMovies();
  const [status,          setStatus]          = useState(movie.status);
  const [rating,          setRating]          = useState(movie.rating || 0);
  const [review,          setReview]          = useState(movie.review || "");
  const [genre,           setGenre]           = useState(movie.genre || "Other");
  const [watchedEpisodes, setWatchedEpisodes] = useState(movie.watchedEpisodes || 0);
  const [currentSeason,   setCurrentSeason]   = useState(movie.currentSeason || 1);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isTV = movie.type === "tv";

  const progress = isTV && movie.totalEpisodes
    ? Math.round((watchedEpisodes / movie.totalEpisodes) * 100)
    : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMovie(movie._id, { status, rating, review, genre, watchedEpisodes: Number(watchedEpisodes), currentSeason: Number(currentSeason) });
      onClose();
    } catch (_) {}
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${movie.title}" from your list?`)) return;
    setDeleting(true);
    await deleteMovie(movie._id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-head">
          {movie.poster
            ? <img className="modal-poster-img" src={movie.poster} alt={movie.title} />
            : <div className="modal-poster-img" style={{ display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",background:"var(--bg3)" }}>{isTV ? "📺" : "🎬"}</div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ background: isTV ? "rgba(88,166,255,0.15)" : "rgba(240,165,0,0.15)", color: isTV ? "var(--blue)" : "var(--accent)", padding:"2px 10px", borderRadius:20, fontSize:"0.72rem", fontWeight:700 }}>
                {isTV ? "📺 TV Show" : "🎬 Movie"}
              </span>
            </div>
            <div className="modal-movie-title">{movie.title}</div>
            <div className="modal-movie-meta">
              {movie.year && <span>{movie.year}</span>}
              {movie.genre && <span> · {movie.genre}</span>}
              {isTV && movie.totalSeasons && <span> · {movie.totalSeasons} seasons</span>}
              {isTV && movie.totalEpisodes && <span> · {movie.totalEpisodes} eps</span>}
            </div>
            {movie.overview && <div className="modal-movie-overview">{movie.overview}</div>}
          </div>
        </div>

        <div className="modal-body">

          {/* Status */}
          <div className="field-label">Status</div>
          <div className="status-row" style={{ marginBottom:18 }}>
            <button className={"status-opt " + (status==="watchlist" ? "sel-watchlist" : "")} onClick={() => setStatus("watchlist")}>⏳ Watchlist</button>
            {isTV && <button className={"status-opt " + (status==="watching" ? "sel-watching" : "")} style={status==="watching" ? {background:"rgba(240,165,0,0.14)",borderColor:"var(--accent)",color:"var(--accent)"} : {}} onClick={() => setStatus("watching")}>▶️ Watching</button>}
            <button className={"status-opt " + (status==="watched" ? "sel-watched" : "")} onClick={() => setStatus("watched")}>{isTV ? "✅ Finished" : "✅ Watched"}</button>
          </div>

          {/* TV Episode tracker */}
          {isTV && (
            <div style={{ background:"var(--bg3)", borderRadius:10, padding:16, marginBottom:18, border:"1px solid var(--border)" }}>
              <div className="field-label" style={{ marginBottom:12 }}>📺 Episode Progress</div>

              {/* Progress bar */}
              {movie.totalEpisodes > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"var(--text2)", marginBottom:6 }}>
                    <span>{watchedEpisodes} / {movie.totalEpisodes} episodes</span>
                    <span style={{ color:"var(--accent)", fontWeight:700 }}>{progress}%</span>
                  </div>
                  <div style={{ height:8, background:"var(--bg4)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,var(--accent),var(--accent2))", borderRadius:4, transition:"width 0.4s" }} />
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.72rem", color:"var(--text2)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.6px" }}>Watched Episodes</div>
                  <input
                    type="number" min={0} max={movie.totalEpisodes || 9999}
                    className="form-input" style={{ padding:"8px 12px", fontSize:"0.9rem" }}
                    value={watchedEpisodes}
                    onChange={e => setWatchedEpisodes(Math.max(0, Number(e.target.value)))}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"0.72rem", color:"var(--text2)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.6px" }}>Current Season</div>
                  <input
                    type="number" min={1} max={movie.totalSeasons || 99}
                    className="form-input" style={{ padding:"8px 12px", fontSize:"0.9rem" }}
                    value={currentSeason}
                    onChange={e => setCurrentSeason(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>
              {movie.totalEpisodes > 0 && (
                <button
                  className="btn btn-ghost btn-sm" style={{ marginTop:10, width:"100%", justifyContent:"center" }}
                  onClick={() => { setWatchedEpisodes(movie.totalEpisodes); setStatus("watched"); }}
                >
                  ✅ Mark all episodes watched
                </button>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="field-label">Your Rating</div>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <div style={{ marginBottom:18 }} />

          {/* Genre */}
          <div className="field-label">Genre</div>
          <div className="genre-pills">
            {GENRES.map(g => (
              <span key={g} className={"genre-pill " + (genre===g ? "sel" : "")} onClick={() => setGenre(g)}>{g}</span>
            ))}
          </div>

          {/* Review */}
          <div className="field-label">Review</div>
          <textarea className="form-input form-textarea" placeholder="Write your thoughts…" value={review} onChange={e => setReview(e.target.value)} maxLength={2000} />
          <div style={{ textAlign:"right", fontSize:"0.72rem", color:"var(--text3)", marginTop:4 }}>{review.length}/2000</div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : "💾 Save Changes"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>{deleting ? "…" : "🗑️"}</button>
        </div>
      </div>
    </div>
  );
}
