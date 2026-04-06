import { useState } from "react";
import { useMovies } from "../context/MovieContext";
import { posterUrl } from "../utils/tmdb";
import StarRating from "./StarRating";

const GENRES = ["Action","Animation","Comedy","Crime","Documentary","Drama","Fantasy","Horror","Romance","Sci-Fi","Thriller","Other"];

export default function BrowseDetailPopup({ item, type, onClose }) {
  const { addMovie, movies, updateMovie } = useMovies();
  const [status,  setStatus]  = useState("watchlist");
  const [rating,  setRating]  = useState(0);
  const [genre,   setGenre]   = useState("Other");
  const [saving,  setSaving]  = useState(false);

  const title    = type === "tv" ? item.name  : item.title;
  const year     = type === "tv" ? item.first_air_date?.split("-")[0] : item.release_date?.split("-")[0];
  const score    = Math.round((item.vote_average || 0) * 10);
  const scoreColor = score >= 75 ? "var(--green)" : score >= 50 ? "var(--accent)" : "var(--red)";

  const existing = movies.find(m => m.tmdbId === item.id && m.type === type);

  const handleAdd = async () => {
    setSaving(true);
    try {
      if (existing) {
        await updateMovie(existing._id, { status, rating, genre });
      } else {
        await addMovie({
          tmdbId:   item.id,
          title,
          type,
          year:     year || "",
          poster:   item.poster_path ? posterUrl(item.poster_path) : "",
          overview: item.overview || "",
          genre,
          status,
          rating,
          review:   "",
          totalSeasons:   item.number_of_seasons  || null,
          totalEpisodes:  item.number_of_episodes || null,
          watchedEpisodes: 0,
          currentSeason:  1,
        });
      }
      onClose();
    } catch (_) {}
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>

        {/* ── HERO SECTION ── */}
        <div style={{ position:"relative", height: 180, overflow:"hidden", borderRadius:"16px 16px 0 0" }}>
          {item.backdrop_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w780${item.backdrop_path}`}
              alt={title}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
            />
          ) : (
            <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg, var(--bg3), var(--bg4))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"4rem" }}>
              {type === "tv" ? "📺" : "🎬"}
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,17,23,1) 0%, rgba(13,17,23,0.3) 100%)" }} />

          {/* Close button */}
          <button onClick={onClose} style={{ position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.6)", border:"none", color:"var(--text)", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:"1rem", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>✕</button>

          {/* Score */}
          <div style={{ position:"absolute", top:10, left:10, width:46, height:46, borderRadius:"50%", background:"rgba(7,9,13,0.88)", border:`2.5px solid ${scoreColor}`, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", backdropFilter:"blur(4px)" }}>
            <span style={{ fontSize:"0.82rem", fontWeight:800, color:scoreColor, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{score}</span>
            <span style={{ fontSize:"0.5rem", color:scoreColor }}>%</span>
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="modal-head" style={{ paddingTop:14 }}>
          {item.poster_path ? (
            <img className="modal-poster-img" src={posterUrl(item.poster_path)} alt={title} style={{ marginTop:-50, boxShadow:"0 8px 24px rgba(0,0,0,0.8)", border:"3px solid var(--bg2)", zIndex:1 }} />
          ) : (
            <div className="modal-poster-img" style={{ display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",background:"var(--bg3)",marginTop:-50,border:"3px solid var(--bg2)" }}>
              {type === "tv" ? "📺" : "🎬"}
            </div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ background: type==="tv" ? "rgba(88,166,255,0.15)" : "rgba(240,165,0,0.15)", color: type==="tv" ? "var(--blue)" : "var(--accent)", padding:"2px 10px", borderRadius:20, fontSize:"0.72rem", fontWeight:700 }}>
                {type === "tv" ? "📺 TV Show" : "🎬 Movie"}
              </span>
              {existing && (
                <span style={{ background:"rgba(63,185,80,0.15)", color:"var(--green)", padding:"2px 10px", borderRadius:20, fontSize:"0.72rem", fontWeight:700 }}>
                  ✅ In Library
                </span>
              )}
            </div>
            <div className="modal-movie-title">{title}</div>
            <div className="modal-movie-meta">
              {year && <span>{year}</span>}
              {item.number_of_seasons && <span> · {item.number_of_seasons} seasons</span>}
              {item.number_of_episodes && <span> · {item.number_of_episodes} eps</span>}
              {item.runtime && <span> · {item.runtime} min</span>}
            </div>
            {item.overview && (
              <div className="modal-movie-overview">{item.overview}</div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="modal-body">

          {/* Status */}
          <div className="field-label">Add as</div>
          <div className="status-row" style={{ marginBottom:18 }}>
            <button className={"status-opt " + (status==="watchlist" ? "sel-watchlist" : "")} onClick={() => setStatus("watchlist")}>⏳ Watchlist</button>
            {type === "tv" && (
              <button className={"status-opt " + (status==="watching" ? "sel-watching" : "")}
                style={status==="watching" ? {background:"rgba(240,165,0,0.14)",borderColor:"var(--accent)",color:"var(--accent)"} : {}}
                onClick={() => setStatus("watching")}>▶️ Watching</button>
            )}
            <button className={"status-opt " + (status==="watched" ? "sel-watched" : "")} onClick={() => setStatus("watched")}>
              {type === "tv" ? "✅ Finished" : "✅ Watched"}
            </button>
          </div>

          {/* Rating */}
          <div className="field-label">Quick Rating</div>
          <StarRating value={rating} onChange={setRating} size="lg" />
          <div style={{ marginBottom:18 }} />

          {/* Genre */}
          <div className="field-label">Genre</div>
          <div className="genre-pills">
            {GENRES.map(g => (
              <span key={g} className={"genre-pill " + (genre===g ? "sel" : "")} onClick={() => setGenre(g)}>{g}</span>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="modal-foot">
          <button className="btn btn-primary" style={{ flex:1 }} onClick={handleAdd} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : existing ? "💾 Update" : `+ Add to ${status === "watchlist" ? "Watchlist" : status === "watching" ? "Watching" : "Watched"}`}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
