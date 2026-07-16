import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { MovieProvider, useMovies } from "../context/MovieContext";
import Toast from "./Toast";
import SearchBar from "./SearchBar";

// ── Top nav links (primary)
const PRIMARY_NAV = [
  { path: "/",         label: "Home",        exact: true  },
  { path: "/movies",   label: "Movies",      exact: true  },
  { path: "/tvshows",  label: "TV Shows",    exact: true  },
  { path: "/watchlist",label: "Watchlist",   exact: true  },
  { path: "/watching", label: "Watch Next",  exact: true  },
];

function TopNavInner() {
  const { user, logout }              = useAuth();
  const { movies, fetchMovies, toast } = useMovies();
  const navigate                      = useNavigate();
  const location                      = useLocation();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const dropRef  = useRef(null);
  const menuRef  = useRef(null);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setDropOpen(false);
      if (menuRef.current  && !menuRef.current.contains(e.target))   setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const watchlistCount  = movies.filter(m => m.status === "watchlist").length;
  const watchingCount   = movies.filter(m => m.status === "watching" && m.type === "tv").length;

  const isActive = ({ path, exact }) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path) && location.pathname !== "/";
  };

  return (
    <div className="fv-root">

      {/* ══ TOP NAVIGATION ══════════════════════════════════════ */}
      <header className="fv-nav">

        {/* Left — Logo */}
        <div className="fv-nav__left">
          <button className="fv-logo" onClick={() => navigate("/")}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="url(#fv-g)"/>
              <path d="M11 8.5l10 6.5-10 6.5V8.5z" fill="#fff"/>
              <defs>
                <linearGradient id="fv-g" x1="0" y1="0" x2="30" y2="30">
                  <stop offset="0%" stopColor="#EC4899"/>
                  <stop offset="100%" stopColor="#BE185D"/>
                </linearGradient>
              </defs>
            </svg>
            <span>FilmVault</span>
          </button>
        </div>

        {/* Center — Search */}
        <div className="fv-nav__center">
          <SearchBar />
        </div>

        {/* Right — Nav links + Bell + Avatar */}
        <div className="fv-nav__right">
          {/* Primary nav links */}
          <nav className="fv-nav__links">
            {PRIMARY_NAV.map(item => (
              <button
                key={item.label}
                className={`fv-navlink ${isActive(item) ? "fv-navlink--active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
                {item.label === "Watchlist" && watchlistCount > 0 && (
                  <span className="fv-navlink__badge">{watchlistCount}</span>
                )}
                {item.label === "Watch Next" && watchingCount > 0 && (
                  <span className="fv-navlink__badge" style={{ background: "var(--green)" }}>{watchingCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Notification bell */}
          <button className="fv-nav__icon-btn" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* Avatar + dropdown */}
          <div className="fv-avatar-wrap" ref={dropRef}>
            <button
              className="fv-avatar"
              onClick={() => setDropOpen(d => !d)}
              aria-label="Profile menu"
            >
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </button>

            {dropOpen && (
              <div className="fv-dropdown">
                <div className="fv-dropdown__user">
                  <div className="fv-dropdown__name">{user?.username || "User"}</div>
                  <div className="fv-dropdown__email">{user?.email}</div>
                </div>
                <div className="fv-dropdown__divider" />
                <button className="fv-dropdown__item" onClick={() => { navigate("/watching"); setDropOpen(false); }}>
                  <span>▶</span> Watch Next
                </button>
                <button className="fv-dropdown__item" onClick={() => { navigate("/history");  setDropOpen(false); }}>
                  <span>✅</span> Watched
                </button>
                <button className="fv-dropdown__item" onClick={() => { navigate("/ai");       setDropOpen(false); }}>
                  <span>🤖</span> AI Picks
                </button>
                <button className="fv-dropdown__item" onClick={() => { navigate("/stats");    setDropOpen(false); }}>
                  <span>📊</span> Statistics
                </button>
                <div className="fv-dropdown__divider" />
                <button className="fv-dropdown__item fv-dropdown__item--danger" onClick={logout}>
                  <span>↩</span> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="fv-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fv-mobile-drawer" ref={menuRef}>
          {PRIMARY_NAV.map(item => (
            <button
              key={item.label}
              className={`fv-mobile-link ${isActive(item) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
          <div className="fv-dropdown__divider" style={{ margin: "8px 0" }} />
          <button className="fv-mobile-link" onClick={() => navigate("/watching")}>▶ Watch Next</button>
          <button className="fv-mobile-link" onClick={() => navigate("/history")}>✅ Watched</button>
          <button className="fv-mobile-link" onClick={() => navigate("/ai")}>🤖 AI Picks</button>
          <button className="fv-mobile-link" onClick={() => navigate("/stats")}>📊 Statistics</button>
          <button className="fv-mobile-link fv-dropdown__item--danger" onClick={logout}>↩ Sign Out</button>
        </div>
      )}

      {/* ══ PAGE CONTENT ═══════════════════════════════════════ */}
      <main className="fv-main">
        <Outlet />
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

export default function Layout() {
  return <MovieProvider><TopNavInner /></MovieProvider>;
}
