const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

export const searchAll = async (query) => {
  if (!TMDB_KEY || TMDB_KEY === "your_tmdb_key_here") {
    return DEMO_DATA.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
  }
  try {
    const [movies, shows] = await Promise.all([
      fetch(`${BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`).then(r => r.json()),
      fetch(`${BASE}/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`).then(r => r.json()),
    ]);
    const movieResults = (movies.results || []).slice(0, 5).map(m => ({ ...m, title: m.title, mediaType: "movie", year: m.release_date?.split("-")[0] || "" }));
    const tvResults    = (shows.results  || []).slice(0, 5).map(s => ({ ...s, title: s.name,  mediaType: "tv",    year: s.first_air_date?.split("-")[0] || "", totalSeasons: s.number_of_seasons, totalEpisodes: s.number_of_episodes }));
    return [...movieResults, ...tvResults].sort((a,b) => (b.popularity||0) - (a.popularity||0)).slice(0,10);
  } catch { return []; }
};

// Keep old export for backward compat
export const searchMovies = searchAll;

export const posterUrl = (path, size = "w342") => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const DEMO_DATA = [
  { id: 27205,  title: "Inception",        mediaType: "movie", release_date: "2010-07-16", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", overview: "A thief who steals corporate secrets through dream-sharing technology.", year: "2010" },
  { id: 155,    title: "The Dark Knight",  mediaType: "movie", release_date: "2008-07-18", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", overview: "Batman raises the stakes in his war on crime.", year: "2008" },
  { id: 1396,   title: "Breaking Bad",     mediaType: "tv",    first_air_date: "2008-01-20", poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", overview: "A chemistry teacher turned drug kingpin.", year: "2008", totalSeasons: 5, totalEpisodes: 62 },
  { id: 1399,   title: "Game of Thrones",  mediaType: "tv",    first_air_date: "2011-04-17", poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg", overview: "Nine noble families fight for control of Westeros.", year: "2011", totalSeasons: 8, totalEpisodes: 73 },
  { id: 157336, title: "Interstellar",     mediaType: "movie", release_date: "2014-11-05", poster_path: "/gEU2QniE6E77NI6lZuvRiAtBkVM.jpg", overview: "Astronauts travel through a wormhole.", year: "2014" },
  { id: 66732,  title: "Stranger Things",  mediaType: "tv",    first_air_date: "2016-07-15", poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", overview: "A group of kids encounter supernatural forces.", year: "2016", totalSeasons: 4, totalEpisodes: 34 },
];
