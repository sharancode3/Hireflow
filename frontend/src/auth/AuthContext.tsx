import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User, UserRole } from "../types";
import { getCurrentSession, getCurrentUser, onAuthStateChange, signOut as signOutUser } from "../services/authService";

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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY_2);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    void signOutUser();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((payload: { token: string; user: User }) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const session = await getCurrentSession();
      const currentUser = await getCurrentUser();
      setToken(session.token);
      setUser(currentUser);
      if (session.token) localStorage.setItem(TOKEN_KEY, session.token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      await refreshMe();
      setIsLoading(false);
    };

    void bootstrap();

    const unsubscribe = onAuthStateChange((nextUser) => {
      setUser(nextUser);
      void getCurrentSession().then((session) => {
        setToken(session.token);
        if (session.token) localStorage.setItem(TOKEN_KEY, session.token);
        else localStorage.removeItem(TOKEN_KEY);
      });
    });

    return () => {
      unsubscribe();
    };
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
