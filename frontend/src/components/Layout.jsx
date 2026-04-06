import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { MovieProvider, useMovies } from "../context/MovieContext";
import Toast from "./Toast";

// SVG icons — no emojis
const Icons = {
  home:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  tv:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>,
  watch:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  stats:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  ai:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>,
  menu:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  logout:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const NAV_ITEMS = [
  { path: "/",          icon: Icons.home,    label: "Dashboard",  section: "library"  },
  { path: "/tvshows",   icon: Icons.tv,      label: "TV Shows",   section: "library"  },
  { path: "/watchlist", icon: Icons.watch,   label: "Watchlist",  section: "library"  },
  { path: "/history",   icon: Icons.history, label: "Watched",    section: "library"  },
  { path: "/stats",     icon: Icons.stats,   label: "Statistics", section: "insights" },
  { path: "/ai",        icon: Icons.ai,      label: "AI Picks",   section: "insights" },
];

function SidebarInner() {
  const { user, logout }               = useAuth();
  const { movies, fetchMovies, toast } = useMovies();
  const navigate                       = useNavigate();
  const location                       = useLocation();
  const [sidebarOpen, setSidebarOpen]  = useState(false);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const counts = {
    "/watchlist": movies.filter(m => m.status === "watchlist").length,
    "/history":   movies.filter(m => m.status === "watched").length,
    "/tvshows":   movies.filter(m => m.type === "tv").length,
  };

  const libraryItems  = NAV_ITEMS.filter(n => n.section === "library");
  const insightItems  = NAV_ITEMS.filter(n => n.section === "insights");
  const userInitial   = (user?.username?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="app-layout">
      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        {Icons.menu}
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">FilmVault</div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Library</div>
            {libraryItems.map(({ path, icon, label }) => (
              <button
                key={path}
                className={`nav-link ${location.pathname === path ? "active" : ""}`}
                onClick={() => navigate(path)}
              >
                <span className="icon">{icon}</span>
                {label}
                {counts[path] > 0 && <span className="nav-badge">{counts[path]}</span>}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Insights</div>
            {insightItems.map(({ path, icon, label }) => (
              <button
                key={path}
                className={`nav-link ${location.pathname === path ? "active" : ""}`}
                onClick={() => navigate(path)}
              >
                <span className="icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-info">
              <div className="user-name">{user?.username || "User"}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button className="logout-btn" title="Sign out" onClick={logout}>
              {Icons.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <button
            key={path}
            className={`bottom-nav-item ${location.pathname === path ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
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
