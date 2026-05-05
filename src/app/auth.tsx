import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { users } from "./api";
import type { UserResponse } from "./api";

const AUTH_URL = import.meta.env.VITE_AUTH_URL as string;

function getRoleFromToken(token: string): string {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.role ?? "user";
  } catch {
    return "user";
  }
}

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  role: string;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function getInitialToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  const t = params.get("token");
  if (t) {
    localStorage.setItem("token", t);
    window.history.replaceState({}, "", window.location.pathname);
    return t;
  }
  return localStorage.getItem("token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
      .catch((err) => {
        // Only clear token on 401 — network errors or other failures should not log the user out
        if (err?.status === 401) {
          localStorage.removeItem("token");
          setToken(null);
        }
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
    <AuthContext.Provider value={{ token, user, role: token ? getRoleFromToken(token) : "user", loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
