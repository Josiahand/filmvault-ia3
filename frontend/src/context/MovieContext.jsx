import { createContext, useContext, useState, useCallback } from "react";
import api from "../utils/api";

const MovieContext = createContext(null);

export const MovieProvider = ({ children }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/movies");
      setMovies(data.movies);
    } catch (e) {
      showToast("Failed to load movies", "error");
    }
    setLoading(false);
  }, []);

  const addMovie = async (movieData) => {
    try {
      const { data } = await api.post("/movies", movieData);
      setMovies((prev) => [data.movie, ...prev]);
      showToast(`"${data.movie.title}" added to your list ✅`);
      return data.movie;
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to add movie";
      showToast(msg, "error");
      throw e;
    }
  };

  const updateMovie = async (id, updates) => {
    try {
      const { data } = await api.put(`/movies/${id}`, updates);
      setMovies((prev) => prev.map((m) => (m._id === id ? data.movie : m)));
      showToast("Saved! 💾");
      return data.movie;
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to update";
      console.error("[updateMovie] Error:", msg, e.response?.data);
      showToast(msg, "error");
      throw e;
    }
  };

  // Toggle a single episode watched state — PATCH /:id/episode
  const toggleEpisode = async (id, episodeKey, watched) => {
    try {
      const { data } = await api.patch(`/movies/${id}/episode`, { episodeKey, watched });
      setMovies((prev) => prev.map((m) => (m._id === id ? data.movie : m)));
      return data.movie;
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to save episode";
      console.error("[toggleEpisode] Error:", msg, e.response?.data);
      showToast(msg, "error");
      throw e;
    }
  };

  const deleteMovie = async (id) => {
    try {
      await api.delete(`/movies/${id}`);
      setMovies((prev) => prev.filter((m) => m._id !== id));
      showToast("Removed from your list");
    } catch (e) {
      showToast("Failed to remove", "error");
    }
  };

  return (
    <MovieContext.Provider value={{ movies, loading, fetchMovies, addMovie, updateMovie, toggleEpisode, deleteMovie, toast }}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => useContext(MovieContext);
