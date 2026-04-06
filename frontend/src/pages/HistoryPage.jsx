import { useMovies } from "../context/MovieContext";
import MovieGrid from "../components/MovieGrid";
export default function HistoryPage() {
  const { movies, loading } = useMovies();
  const watched = movies.filter(m => m.status === "watched");
  return (
    <div className="page-body">
      <div className="page-header">
        <div className="page-title">Watched</div>
        <div className="page-subtitle">{watched.length} movie{watched.length !== 1 ? "s" : ""} watched</div>
      </div>
      {loading
        ? <div className="empty"><div className="spinner" style={{ width:36,height:36,borderWidth:3,margin:"0 auto" }} /></div>
        : <MovieGrid movies={watched} emptyIcon={null} emptyTitle="No watched movies yet" emptyText="Open a movie from your library and mark it as Watched" />
      }
    </div>
  );
}
