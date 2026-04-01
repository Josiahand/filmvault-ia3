import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("filmvault_user")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("filmvault_token", data.token);
    localStorage.setItem("filmvault_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post("/auth/register", { username, email, password });
    localStorage.setItem("filmvault_token", data.token);
    localStorage.setItem("filmvault_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("filmvault_token");
    localStorage.removeItem("filmvault_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
