const TMDB_KEY = ""; // disabled for safety
const BASE = "https://api.themoviedb.org/3";

// Always fallback to demo data (safe for project)
const hasKey = () => false;

// Safe fetch (kept for future use)
const safeFetch = async (url) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
};

// SEARCH (always uses demo data now)
export const searchAll = async (query) => {
  const q = query.toLowerCase();

  return DEMO_DATA.filter((m) =>
    m.title.toLowerCase().includes(q) ||
    (m.name && m.name.toLowerCase().includes(q))
  );
};

// alias
export const searchMovies = searchAll;

// Poster helper
export const posterUrl = (path, size = "w342") => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Popular (disabled API → returns demo)
export const fetchPopular = async () => {
  return {
    results: DEMO_DATA,
    total_pages: 1,
  };
};

// DEMO DATA (with TV shows + episodes)
const DEMO_DATA = [
  {
    id: 27205,
    title: "Inception",
    mediaType: "movie",
    year: "2010",
    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    vote_average: 8.8,
    popularity: 100,
  },
  {
    id: 155,
    title: "The Dark Knight",
    mediaType: "movie",
    year: "2008",
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    vote_average: 9.0,
    popularity: 98,
  },
  {
    id: 157336,
    title: "Interstellar",
    mediaType: "movie",
    year: "2014",
    poster_path: "/gEU2QniE6E77NI6lZuvRiAtBkVM.jpg",
    vote_average: 8.6,
    popularity: 95,
  },
  {
    id: 1396,
    title: "Breaking Bad",
    name: "Breaking Bad",
    mediaType: "tv",
    year: "2008",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    vote_average: 9.5,
    popularity: 90,
    totalSeasons: 5,
    totalEpisodes: 62,
  },
  {
    id: 1399,
    title: "Game of Thrones",
    name: "Game of Thrones",
    mediaType: "tv",
    year: "2011",
    poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
    vote_average: 9.2,
    popularity: 88,
    totalSeasons: 8,
    totalEpisodes: 73,
  },
  {
    id: 66732,
    title: "Stranger Things",
    name: "Stranger Things",
    mediaType: "tv",
    year: "2016",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    vote_average: 8.7,
    popularity: 85,
    totalSeasons: 4,
    totalEpisodes: 34,
  },
  {
    id: 496243,
    title: "Parasite",
    mediaType: "movie",
    year: "2019",
    poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    vote_average: 8.5,
    popularity: 82,
  },
  {
    id: 872585,
    title: "Oppenheimer",
    mediaType: "movie",
    year: "2023",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    vote_average: 8.3,
    popularity: 80,
  },
];