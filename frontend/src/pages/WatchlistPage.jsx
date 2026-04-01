import { useMovies } from "../context/MovieContext";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";

export default function WatchlistPage() {
  const { movies, loading } = useMovies();
  const watchlist = movies.filter((m) => m.status === "watchlist");

  return (
    <>
      <div className="page-header">
        <div className="page-title">Watchlist</div>
        <div className="page-subtitle">{watchlist.length} movie{watchlist.length !== 1 ? "s" : ""} to watch</div>
      </div>

      <SearchBar />

      {loading ? (
        <div className="empty"><div className="spinner" style={{ width:36,height:36,borderWidth:3,margin:"0 auto" }} /></div>
      ) : (
        <MovieGrid
          movies={watchlist}
          emptyIcon="⏳"
          emptyTitle="Your watchlist is empty"
          emptyText="Search for movies and add them to your watchlist"
        />
      )}
    </>
  );
}
