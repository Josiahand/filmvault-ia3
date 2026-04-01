import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import WatchlistPage from "./pages/WatchlistPage";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";
import AIPage from "./pages/AIPage";
import TVShowsPage from "./pages/TVShowsPage";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="tvshows" element={<TVShowsPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="ai" element={<AIPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
