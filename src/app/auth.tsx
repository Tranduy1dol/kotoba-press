import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { users } from "./api";
import type { UserResponse } from "./api";

const AUTH_URL = import.meta.env.VITE_AUTH_URL as string;

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Capture token from OAuth callback (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
      // Clean token from URL without a history entry
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  // Fetch user whenever token changes
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    users.me()
      .then(setUser)
      .catch(() => {
        // Token invalid or expired
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = () => {
    window.location.href = AUTH_URL;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
