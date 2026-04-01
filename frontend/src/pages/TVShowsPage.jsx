import { useMovies } from "../context/MovieContext";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";

export default function TVShowsPage() {
  const { movies, loading } = useMovies();
  const shows    = movies.filter(m => m.type === "tv");
  const watching = shows.filter(m => m.status === "watching");
  const finished = shows.filter(m => m.status === "watched");
  const planned  = shows.filter(m => m.status === "watchlist");

  return (
    <>
      <div className="page-header">
        <div className="page-title">📺 TV Shows</div>
        <div className="page-subtitle">{shows.length} show{shows.length !== 1 ? "s" : ""} in your collection</div>
      </div>

      <SearchBar />

      {loading ? (
        <div className="empty"><div className="spinner" style={{ width:36,height:36,borderWidth:3,margin:"0 auto" }} /></div>
      ) : shows.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📺</div>
          <div className="empty-title">No TV shows yet</div>
          <div className="empty-sub">Search for a TV show above to add it</div>
        </div>
      ) : (
        <>
          {watching.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom:14 }}>▶️ Currently Watching</div>
              <MovieGrid movies={watching} emptyIcon="▶️" emptyTitle="" emptyText="" />
              <div style={{ marginBottom:28 }} />
            </>
          )}
          {planned.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom:14 }}>⏳ Plan to Watch</div>
              <MovieGrid movies={planned} emptyIcon="⏳" emptyTitle="" emptyText="" />
              <div style={{ marginBottom:28 }} />
            </>
          )}
          {finished.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom:14 }}>✅ Finished</div>
              <MovieGrid movies={finished} emptyIcon="✅" emptyTitle="" emptyText="" />
            </>
          )}
        </>
      )}
    </>
  );
}
