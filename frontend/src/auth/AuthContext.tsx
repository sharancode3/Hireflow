import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiJson } from "../api/client";
import type { User, UserRole } from "../types";

type AuthState = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (payload: { token: string; user: User }) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "hireflow_token";
const LEGACY_TOKEN_KEY_2 = "talvion_token";
const LEGACY_TOKEN_KEY = "hirehub_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const current = localStorage.getItem(TOKEN_KEY);
    if (current) return current;
    const legacy2 = localStorage.getItem(LEGACY_TOKEN_KEY_2);
    if (legacy2) {
      localStorage.setItem(TOKEN_KEY, legacy2);
      localStorage.removeItem(LEGACY_TOKEN_KEY_2);
      return legacy2;
    }
    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      localStorage.setItem(TOKEN_KEY, legacy);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacy;
    }
    return null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY_2);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((payload: { token: string; user: User }) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const data = await apiJson<{ user: User }>("/auth/me", { token });
      setUser(data.user);
    } catch {
      logout();
    }
  }, [token, logout]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refreshMe();
      setIsLoading(false);
    })();
  }, [refreshMe]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isLoading,
      login,
      logout,
      refreshMe,
      hasRole: (role) => user?.role === role,
    }),
    [token, user, isLoading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
