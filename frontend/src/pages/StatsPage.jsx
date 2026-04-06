import { useEffect, useState } from "react";
import api from "../utils/api";
import { useMovies } from "../context/MovieContext";

export default function StatsPage() {
  const { movies } = useMovies();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/movies/stats")
      .then(({ data }) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [movies]);

  // Local fallback stats
  const watched = movies.filter((m) => m.status === "watched");
  const wlCount = movies.filter((m) => m.status === "watchlist").length;
  const rated = watched.filter((m) => m.rating > 0);

  const localAvg = rated.length
    ? (
        rated.reduce((s, m) => s + m.rating, 0) / rated.length
      ).toFixed(1)
    : "—";

  // Genre stats
  const genreMap = {};
  watched.forEach((m) => {
    if (m.genre) genreMap[m.genre] = (genreMap[m.genre] || 0) + 1;
  });

  const genreList = Object.entries(genreMap).sort((a, b) => b[1] - a[1]);
  const maxGenre = genreList[0]?.[1] || 1;

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: watched.filter((m) => m.rating === s).length,
  }));

  const maxRating = Math.max(...ratingDist.map((r) => r.count), 1);

  const topStats = [
    { value: watched.length, label: "Movies Watched", cls: "c-accent" },
    { value: wlCount, label: "On Watchlist", cls: "c-blue" },
    { value: localAvg, label: "Average Rating", cls: "c-green" },
    {
      value: genreList[0]?.[0] || "—",
      label: "Favorite Genre",
      cls: "c-purple",
    },
  ];

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">Statistics</div>
        <div className="page-subtitle">
          Your movie watching insights
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-cards">
        {topStats.map((s, i) => (
          <div
            className="stat-card"
            key={i}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className={`stat-num ${s.cls}`}>{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {watched.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No data yet</div>
          <div className="empty-sub">
            Mark some movies as Watched to see your stats
          </div>
        </div>
      ) : (
        <div className="stats-content">
          {/* Genre Chart */}
          {genreList.length > 0 && (
            <div className="chart-card">
              <div className="chart-heading">
                Movies by Genre
              </div>
              <div className="bar-chart">
                {genreList.map(([genre, count]) => (
                  <div key={genre} className="bar-row">
                    <span className="bar-lbl">{genre}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-fill-accent"
                        style={{
                          width: `${(count / maxGenre) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="bar-n">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating Chart */}
          <div className="chart-card">
            <div className="chart-heading">
              Rating Distribution
            </div>
            <div className="bar-chart">
              {ratingDist.map(({ star, count }) => (
                <div key={star} className="bar-row">
                  <span
                    className="bar-lbl"
                    style={{ color: "var(--accent)" }}
                  >
                    {star} star{star !== 1 ? "s" : ""}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill bar-fill-blue"
                      style={{
                        width: `${(count / maxRating) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="bar-n">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}