import { useState, useEffect, useMemo } from "react";
import { tmdb, posterUrl, profileUrl } from "../utils/tmdb";
import MovieDetailPopup from "./MovieDetailPopup";
import TVDetailPopup from "./TVDetailPopup";

export default function ActorDetailPopup({ actorId, onClose, onOpenMovie, onOpenShow }) {
  const [person, setPerson]         = useState(null);
  const [credits, setCredits]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy]         = useState("popularity"); // "popularity" | "date" | "rating"
  const [activeTab, setActiveTab]   = useState("all");       // "all" | "movie" | "tv"
  const [showFullBio, setShowFullBio] = useState(false);

  // Nested selection state (clicking a movie/show inside actor page)
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedShow, setSelectedShow]   = useState(null);

  useEffect(() => {
    if (!actorId) return;
    setLoading(true);
    tmdb(`/person/${actorId}`, { append_to_response: "combined_credits" })
      .then((data) => {
        setPerson(data);
        const allCast = data?.combined_credits?.cast || [];
        // Deduplicate items by id + media_type
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
        console.error("Failed to fetch actor details:", err);
        setLoading(false);
      });
  }, [actorId]);

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
      if (onOpenShow) {
        onOpenShow(item);
      } else {
        setSelectedShow(item);
      }
    } else {
      if (onOpenMovie) {
        onOpenMovie(item);
      } else {
        setSelectedMovie(item);
      }
    }
  };

  if (!actorId) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          background: "#0D1117",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.9)",
          overflowY: "auto",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#fff",
            fontSize: "1.2rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            transition: "all 0.2s",
          }}
        >
          ✕
        </button>

        {loading ? (
          <div style={{ padding: "80px 20px", textAlign: "center" }}>
            <div
              className="spinner"
              style={{
                width: 44,
                height: 44,
                borderWidth: 3,
                margin: "0 auto 16px",
              }}
            />
            <div style={{ color: "var(--text2)", fontSize: "0.95rem" }}>
              Loading actor details…
            </div>
          </div>
        ) : !person ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <h3>Actor details not found</h3>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: "28px 32px 40px" }}>
            {/* ── ACTOR HEADER ───────────────────────────────── */}
            <div
              style={{
                display: "flex",
                gap: 28,
                alignItems: "flex-start",
                marginBottom: 32,
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
                      width: 180,
                      height: 250,
                      objectFit: "cover",
                      borderRadius: 16,
                      border: "2px solid rgba(255, 255, 255, 0.12)",
                      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.7)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 180,
                      height: 250,
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, var(--bg3), var(--bg4))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "4rem",
                      border: "2px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    👤
                  </div>
                )}
              </div>

              {/* Main Metadata */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--accent)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1.2px",
                    marginBottom: 4,
                  }}
                >
                  {person.known_for_department || "Acting"}
                </div>
                <h1
                  style={{
                    fontSize: "2.3rem",
                    fontWeight: 800,
                    margin: "0 0 12px",
                    lineHeight: 1.1,
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
                    marginBottom: 16,
                  }}
                >
                  {person.birthday && (
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: "8px 14px",
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
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {formatDate(person.birthday)}
                        {age !== null && (
                          <span
                            style={{
                              color: "var(--accent)",
                              marginLeft: 5,
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
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: "8px 14px",
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
                          fontSize: "0.88rem",
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
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 10,
                        padding: "8px 14px",
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
                          fontSize: "0.88rem",
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
                        fontSize: "0.88rem",
                        color: "var(--text2)",
                        lineHeight: 1.7,
                        margin: 0,
                        display: showFullBio ? "block" : "-webkit-box",
                        WebkitLineClamp: showFullBio ? "none" : 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {person.biography}
                    </p>
                    {person.biography.length > 280 && (
                      <button
                        onClick={() => setShowFullBio((prev) => !prev)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent)",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "4px 0 0",
                          display: "inline-block",
                        }}
                      >
                        {showFullBio ? "Show Less ▲" : "Read Full Bio ▼"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.85rem", color: "var(--text3)" }}>
                    No biography available.
                  </div>
                )}
              </div>
            </div>

            {/* ── KNOWN FOR (CAROUSEL) ─────────────────────────── */}
            {knownForItems.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "1px",
                    margin: "0 0 14px",
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
                    gap: 14,
                    overflowX: "auto",
                    paddingBottom: 8,
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
                          width: 130,
                          scrollSnapAlign: "start",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 130,
                            height: 195,
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
                              background: "rgba(0,0,0,0.75)",
                              backdropFilter: "blur(4px)",
                              borderRadius: 6,
                              padding: "2px 6px",
                              fontSize: "0.68rem",
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
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {item.media_type === "tv" ? "TV" : "Movie"}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.82rem",
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
                          style={{ fontSize: "0.72rem", color: "var(--text3)" }}
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
                  marginBottom: 18,
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
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
                      padding: "6px 14px",
                      color: "#fff",
                      fontSize: "0.82rem",
                      outline: "none",
                      width: 170,
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
                          padding: "4px 12px",
                          fontSize: "0.78rem",
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
                      padding: "6px 12px",
                      color: "#fff",
                      fontSize: "0.82rem",
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
                    padding: "36px 0",
                    textAlign: "center",
                    color: "var(--text3)",
                    fontSize: "0.9rem",
                  }}
                >
                  No titles match your search or filter.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: 16,
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
                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
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
                              background: "rgba(0,0,0,0.78)",
                              backdropFilter: "blur(4px)",
                              borderRadius: 6,
                              padding: "2px 6px",
                              fontSize: "0.68rem",
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
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {item.media_type === "tv" ? "TV" : "Movie"}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "0.82rem",
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
                            fontSize: "0.72rem",
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
                                maxWidth: "70px",
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
        )}
      </div>

      {/* Nested Movie Detail Popup if clicked from Actor page */}
      {selectedMovie && (
        <MovieDetailPopup
          item={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onOpenMovie={(m) => setSelectedMovie(m)}
        />
      )}

      {/* Nested TV Detail Popup if clicked from Actor page */}
      {selectedShow && (
        <TVDetailPopup
          item={selectedShow}
          onClose={() => setSelectedShow(null)}
          onOpenShow={(s) => setSelectedShow(s)}
        />
      )}
    </div>
  );
}
