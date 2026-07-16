import { createContext, useContext, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("filmvault_user")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // ── Helper: persist auth state ───────────────────────────────
  const persist = (token, userData) => {
    localStorage.setItem("filmvault_token", token);
    localStorage.setItem("filmvault_user",  JSON.stringify(userData));
    setUser(userData);
  };

  // ── Email / password login ───────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data;
  };

  // ── Email / password register ────────────────────────────────
  const register = async (username, email, password) => {
    const { data } = await api.post("/auth/register", { username, email, password });
    persist(data.token, data.user);
    return data;
  };

  // ── Google OAuth login ───────────────────────────────────────
  // `credential` is the ID token returned by Google via @react-oauth/google
  const googleLogin = async (credential) => {
    const { data } = await api.post("/auth/google", { credential });
    persist(data.token, data.user);
    return data;
  };

  // ── Logout ───────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("filmvault_token");
    localStorage.removeItem("filmvault_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
