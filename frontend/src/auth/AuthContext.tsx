import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User, UserRole } from "../types";
import { getCurrentSession, getCurrentUser, onAuthStateChange, signOut as signOutUser } from "../services/authService";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

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
const AUTH_BOOTSTRAP_TIMEOUT_MS = 7000;
const AUTH_LOADING_WATCHDOG_MS = 9000;

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
      let settled = false;

      void refreshMe().finally(() => {
        settled = true;
        setIsLoading(false);
      });

      window.setTimeout(() => {
        if (!settled) {
          // Never leave app stuck on loading if auth/profile calls are stalled.
          setIsLoading(false);
        }
      }, AUTH_BOOTSTRAP_TIMEOUT_MS);
    };

    void bootstrap();

    const unsubscribe = onAuthStateChange((nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
      void getCurrentSession()
        .then((session) => {
          setToken(session.token);
          if (session.token) localStorage.setItem(TOKEN_KEY, session.token);
          else localStorage.removeItem(TOKEN_KEY);
        })
        .catch(() => {
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        });
    });

    return () => {
      unsubscribe();
    };
  }, [refreshMe]);

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setTimeout(() => {
      // Final safety-net to avoid frozen loading UX on refresh.
      setIsLoading(false);
    }, AUTH_LOADING_WATCHDOG_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          void refreshMe();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, refreshMe]);

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
