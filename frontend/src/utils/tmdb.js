const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY;
const BASE      = "https://api.themoviedb.org/3";

// Check if API key is valid
const hasKey = () => TMDB_KEY && TMDB_KEY !== "your_tmdb_key_here" && TMDB_KEY.length > 10;

// Safe fetch with timeout and error handling
const safeFetch = async (url) => {
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);
    const res        = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

export const searchAll = async (query) => {
  if (!hasKey()) {
    // Fallback to local demo data
    const q = query.toLowerCase();
    return DEMO_DATA.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.name  && m.name.toLowerCase().includes(q))
    );
  }
  const [movies, shows] = await Promise.all([
    safeFetch(`${BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=1`),
    safeFetch(`${BASE}/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&page=1`),
  ]);
  const movieResults = ((movies?.results) || []).slice(0, 5).map(m => ({
    ...m, title: m.title, mediaType: "movie", year: m.release_date?.split("-")[0] || "",
  }));
  const tvResults = ((shows?.results) || []).slice(0, 5).map(s => ({
    ...s, title: s.name, mediaType: "tv", year: s.first_air_date?.split("-")[0] || "",
    totalSeasons: s.number_of_seasons, totalEpisodes: s.number_of_episodes,
  }));
  return [...movieResults, ...tvResults]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 10);
};

// Keep backward compat alias
export const searchMovies = searchAll;

export const posterUrl = (path, size = "w342") => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Fetch popular movies/TV for dashboard browse
export const fetchPopular = async (type = "movie", params = {}) => {
  if (!hasKey()) return { results: [], total_pages: 1 };
  const endpoint = type === "tv" ? "/discover/tv" : "/discover/movie";
  const url      = new URL(`${BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const data = await safeFetch(url.toString());
  return data || { results: [], total_pages: 1 };
};

// Fallback demo data shown when no API key
const DEMO_DATA = [
  {
    id: 27205, title: "Inception", mediaType: "movie",
    release_date: "2010-07-16", year: "2010",
    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    overview: "A thief who steals corporate secrets through dream-sharing technology.",
    vote_average: 8.8, popularity: 100,
  },
  {
    id: 155, title: "The Dark Knight", mediaType: "movie",
    release_date: "2008-07-18", year: "2008",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
    overview: "Batman raises the stakes in his war on crime against the Joker.",
    vote_average: 9.0, popularity: 98,
  },
  {
    id: 157336, title: "Interstellar", mediaType: "movie",
    release_date: "2014-11-05", year: "2014",
    poster_path: "/gEU2QniE6E77NI6lZuvRiAtBkVM.jpg",
    backdrop_path: "/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg",
    overview: "Astronauts travel through a wormhole in search of a new home for humanity.",
    vote_average: 8.6, popularity: 95,
  },
  {
    id: 1396, title: "Breaking Bad", name: "Breaking Bad", mediaType: "tv",
    first_air_date: "2008-01-20", year: "2008",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    overview: "A chemistry teacher diagnosed with cancer turns to making drugs.",
    vote_average: 9.5, popularity: 90,
    totalSeasons: 5, totalEpisodes: 62, number_of_seasons: 5, number_of_episodes: 62,
  },
  {
    id: 1399, title: "Game of Thrones", name: "Game of Thrones", mediaType: "tv",
    first_air_date: "2011-04-17", year: "2011",
    poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
    overview: "Nine noble families wage war against each other to gain control of Westeros.",
    vote_average: 9.2, popularity: 88,
    totalSeasons: 8, totalEpisodes: 73, number_of_seasons: 8, number_of_episodes: 73,
  },
  {
    id: 66732, title: "Stranger Things", name: "Stranger Things", mediaType: "tv",
    first_air_date: "2016-07-15", year: "2016",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    overview: "A group of kids in a small town encounter supernatural forces.",
    vote_average: 8.7, popularity: 85,
    totalSeasons: 4, totalEpisodes: 34, number_of_seasons: 4, number_of_episodes: 34,
  },
  {
    id: 496243, title: "Parasite", mediaType: "movie",
    release_date: "2019-05-30", year: "2019",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    overview: "A poor family schemes to become employed by a wealthy family.",
    vote_average: 8.5, popularity: 82,
  },
  {
    id: 872585, title: "Oppenheimer", mediaType: "movie",
    release_date: "2023-07-21", year: "2023",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    overview: "The story of J. Robert Oppenheimer and the development of the atomic bomb.",
    vote_average: 8.3, popularity: 80,
  },
];
