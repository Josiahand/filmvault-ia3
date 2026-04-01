import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MovieProvider, useMovies } from "../context/MovieContext";
import Toast from "./Toast";

const NAV_ITEMS = [
  { path: "/",          icon: "🏠", label: "Dashboard",  section: "library" },
  { path: "/tvshows",   icon: "📺", label: "TV Shows",   section: "library" },
  { path: "/watchlist", icon: "⏳", label: "Watchlist",  section: "library" },
  { path: "/history",   icon: "✅", label: "Watched",    section: "library" },
  { path: "/stats",     icon: "📊", label: "Statistics", section: "insights" },
  { path: "/ai",        icon: "🤖", label: "AI Picks",   section: "insights" },
];

function SidebarInner() {
  const { user, logout } = useAuth();
  const { movies, fetchMovies, toast } = useMovies();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const counts = {
    "/watchlist": movies.filter(m => m.status === "watchlist").length,
    "/history":   movies.filter(m => m.status === "watched").length,
    "/tvshows":   movies.filter(m => m.type === "tv").length,
  };

  const libraryItems  = NAV_ITEMS.filter(n => n.section === "library");
  const insightItems  = NAV_ITEMS.filter(n => n.section === "insights");

  return (
    <div className="app-layout">

      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">🎬 FilmVault</div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Library</div>
            {libraryItems.map(({ path, icon, label }) => (
              <button key={path} className={"nav-link " + (location.pathname === path ? "active" : "")} onClick={() => navigate(path)}>
                <span className="icon">{icon}</span>
                {label}
                {counts[path] > 0 && <span className="nav-badge">{counts[path]}</span>}
              </button>
            ))}
          </div>
          <div className="nav-section">
            <div className="nav-section-label">Insights</div>
            {insightItems.map(({ path, icon, label }) => (
              <button key={path} className={"nav-link " + (location.pathname === path ? "active" : "")} onClick={() => navigate(path)}>
                <span className="icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}</div>
            <div className="user-info">
              <div className="user-name">{user?.username || "User"}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="logout-btn" title="Sign out" onClick={logout}>↩</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content"><Outlet /></main>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <button key={path} className={"bottom-nav-item " + (location.pathname === path ? "active" : "")} onClick={() => navigate(path)}>
            <span className="bnav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

export default function Layout() {
  return <MovieProvider><SidebarInner /></MovieProvider>;
}
