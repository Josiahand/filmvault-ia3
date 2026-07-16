import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tmdb, posterUrl, profileUrl } from "../utils/tmdb";

export default function PersonDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson]           = useState(null);
  const [credits, setCredits]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy]           = useState("popularity"); // "popularity" | "date" | "rating"
  const [activeTab, setActiveTab]     = useState("all");       // "all" | "movie" | "tv"
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    window.scrollTo(0, 0);

    tmdb(`/person/${id}`, { append_to_response: "combined_credits" })
      .then((data) => {
        setPerson(data);
        const allCast = data?.combined_credits?.cast || [];
        const uniqueItems = [];
        const seen = new Set();
        for (const item of allCast) {
          const key = `${item.id}-${item.media_type || (item.title ? "movie" : "tv")}`;
          if (!seen.has(key) && item.poster_path) {
            seen.add(key);
            uniqueItems.push({
              ...item,
              media_type: item.media_type || (item.title ? "movie" : "tv"),
            });
          }
        }
        setCredits(uniqueItems);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch person details:", err);
        setLoading(false);
      });
  }, [id]);

  // Age calculation helper
  const age = useMemo(() => {
    if (!person?.birthday) return null;
    const birthDate = new Date(person.birthday);
    const endDate = person.deathday ? new Date(person.deathday) : new Date();
    let computedAge = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      computedAge--;
    }
    return computedAge;
  }, [person]);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Filtered and Sorted Filmography
  const filteredAndSortedCredits = useMemo(() => {
    let list = [...credits];

    // Filter by tab
    if (activeTab === "movie") {
      list = list.filter((c) => c.media_type === "movie");
    } else if (activeTab === "tv") {
      list = list.filter((c) => c.media_type === "tv");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const title = (c.title || c.name || "").toLowerCase();
        const character = (c.character || "").toLowerCase();
        return title.includes(q) || character.includes(q);
      });
    }

    // Sort list
    list.sort((a, b) => {
      if (sortBy === "popularity") {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === "rating") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      if (sortBy === "date") {
        const dateA = a.release_date || a.first_air_date || "";
        const dateB = b.release_date || b.first_air_date || "";
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    return list;
  }, [credits, activeTab, searchQuery, sortBy]);

  const knownForItems = useMemo(() => {
    return [...credits]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10);
  }, [credits]);

  const handleCardClick = (item) => {
    if (item.media_type === "tv") {
      navigate(`/tv/${item.id}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="page-body" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3, margin: "0 auto 16px" }} />
        <div style={{ color: "var(--text2)", fontSize: "0.95rem" }}>Loading actor details…</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="page-body" style={{ padding: "60px 24px", textAlign: "center" }}>
        <h3>Actor details not found</h3>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="page-body" style={{ padding: "24px 24px 60px" }}>
      {/* Back Button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* ── ACTOR HEADER ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          {/* Profile Photo */}
          <div style={{ flexShrink: 0 }}>
            {profileUrl(person.profile_path, "h632") ? (
              <img
                src={profileUrl(person.profile_path, "h632")}
                alt={person.name}
                style={{
                  width: 200,
                  height: 280,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "2px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 200,
                  height: 280,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, var(--bg3), var(--bg4))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "4.5rem",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                👤
              </div>
            )}
          </div>

          {/* Main Metadata */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--accent)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginBottom: 6,
              }}
            >
              {person.known_for_department || "Acting"}
            </div>
            <h1
              style={{
                fontSize: "2.8rem",
                fontWeight: 800,
                margin: "0 0 16px",
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              {person.name}
            </h1>

            {/* Quick Info Grid */}
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              {person.birthday && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    padding: "10px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      fontWeight: 700,
                    }}
                  >
                    Born
                  </div>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {formatDate(person.birthday)}
                    {age !== null && (
                      <span
                        style={{
                          color: "var(--accent)",
                          marginLeft: 6,
                          fontWeight: 600,
                        }}
                      >
                        ({age} yrs{person.deathday ? " at death" : ""})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {person.place_of_birth && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    padding: "10px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      fontWeight: 700,
                    }}
                  >
                    Place of Birth
                  </div>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {person.place_of_birth}
                  </div>
                </div>
              )}

              {person.popularity > 0 && (
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 12,
                    padding: "10px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      fontWeight: 700,
                    }}
                  >
                    Popularity
                  </div>
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    🔥 {person.popularity.toFixed(1)}
                  </div>
                </div>
              )}
            </div>

            {/* Biography */}
            {person.biography ? (
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Biography
                </div>
                <p
                  style={{
                    fontSize: "0.92rem",
                    color: "var(--text2)",
                    lineHeight: 1.8,
                    margin: 0,
                    display: showFullBio ? "block" : "-webkit-box",
                    WebkitLineClamp: showFullBio ? "none" : 5,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {person.biography}
                </p>
                {person.biography.length > 300 && (
                  <button
                    onClick={() => setShowFullBio((prev) => !prev)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "6px 0 0",
                      display: "inline-block",
                    }}
                  >
                    {showFullBio ? "Show Less ▲" : "Read Full Bio ▼"}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ fontSize: "0.88rem", color: "var(--text3)" }}>
                No biography available.
              </div>
            )}
          </div>
        </div>

        {/* ── KNOWN FOR (CAROUSEL) ─────────────────────────── */}
        {knownForItems.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.5rem",
                letterSpacing: "1px",
                margin: "0 0 16px",
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🌟 Known For
            </h3>
            <div
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                paddingBottom: 10,
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
              }}
            >
              {knownForItems.map((item) => {
                const title = item.title || item.name || "";
                const year = (
                  item.release_date ||
                  item.first_air_date ||
                  ""
                ).split("-")[0];
                const rating = item.vote_average?.toFixed(1) || "—";
                return (
                  <div
                    key={`${item.id}-${item.media_type}`}
                    onClick={() => handleCardClick(item)}
                    style={{
                      flexShrink: 0,
                      width: 140,
                      scrollSnapAlign: "start",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: 140,
                        height: 210,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "var(--bg3)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                        marginBottom: 8,
                      }}
                    >
                      <img
                        src={posterUrl(item.poster_path, "w342")}
                        alt={title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          background: "rgba(0,0,0,0.8)",
                          backdropFilter: "blur(4px)",
                          borderRadius: 6,
                          padding: "2px 6px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#FBBF24",
                        }}
                      >
                        ⭐ {rating}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          background:
                            item.media_type === "tv"
                              ? "rgba(88,166,255,0.85)"
                              : "rgba(240,165,0,0.85)",
                          color: "#000",
                          borderRadius: 4,
                          padding: "1px 6px",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.media_type === "tv" ? "TV" : "Movie"}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={title}
                    >
                      {title}
                    </div>
                    <div
                      style={{ fontSize: "0.75rem", color: "var(--text3)" }}
                    >
                      {year} {item.character ? `· ${item.character}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── FULL FILMOGRAPHY ────────────────────────────── */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.5rem",
                letterSpacing: "1px",
                margin: 0,
                color: "var(--text)",
              }}
            >
              Filmography ({filteredAndSortedCredits.length})
            </h3>

            {/* Controls: Search + Filter Tabs + Sort */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Search in Filmography */}
              <input
                type="text"
                placeholder="Search filmography…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20,
                  padding: "7px 16px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none",
                  width: 180,
                }}
              />

              {/* Tabs: All / Movies / TV */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 20,
                  padding: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {[
                  { id: "all", label: "All" },
                  { id: "movie", label: "Movies" },
                  { id: "tv", label: "TV Shows" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background:
                        activeTab === tab.id
                          ? "var(--accent)"
                          : "transparent",
                      color: activeTab === tab.id ? "#000" : "var(--text2)",
                      border: "none",
                      borderRadius: 16,
                      padding: "5px 14px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20,
                  padding: "7px 14px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="popularity" style={{ background: "#0D1117" }}>
                  Sort by Popularity
                </option>
                <option value="date" style={{ background: "#0D1117" }}>
                  Sort by Release Date
                </option>
                <option value="rating" style={{ background: "#0D1117" }}>
                  Sort by Rating
                </option>
              </select>
            </div>
          </div>

          {/* Filmography Grid */}
          {filteredAndSortedCredits.length === 0 ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: "var(--text3)",
                fontSize: "0.95rem",
              }}
            >
              No titles match your search or filter.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 18,
              }}
            >
              {filteredAndSortedCredits.map((item) => {
                const title = item.title || item.name || "";
                const year = (
                  item.release_date ||
                  item.first_air_date ||
                  ""
                ).split("-")[0];
                const rating = item.vote_average?.toFixed(1) || "—";
                return (
                  <div
                    key={`${item.id}-${item.media_type}`}
                    onClick={() => handleCardClick(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        paddingTop: "150%",
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "var(--bg3)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                        marginBottom: 8,
                      }}
                    >
                      <img
                        src={posterUrl(item.poster_path, "w342")}
                        alt={title}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          background: "rgba(0,0,0,0.8)",
                          backdropFilter: "blur(4px)",
                          borderRadius: 6,
                          padding: "2px 6px",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#FBBF24",
                        }}
                      >
                        ⭐ {rating}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          background:
                            item.media_type === "tv"
                              ? "rgba(88,166,255,0.85)"
                              : "rgba(240,165,0,0.85)",
                          color: "#000",
                          borderRadius: 4,
                          padding: "1px 6px",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.media_type === "tv" ? "TV" : "Movie"}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={title}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text3)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{year}</span>
                      {item.character && (
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "75px",
                          }}
                          title={item.character}
                        >
                          {item.character}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
