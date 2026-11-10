"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Provider } from "@supabase/supabase-js";
import { api, setToken, type User } from "./api";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "./supabase/client";

type RegisterResult = {
  user: User | null;
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<RegisterResult>;
  loginWithProvider: (provider: "google" | "discord") => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncApiUser = useCallback(async (accessToken: string) => {
    setToken(accessToken);
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
      return me;
    } catch (error) {
      setToken(null);
      setUser(null);
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!configured) {
      setToken(null);
      setUser(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) {
      setToken(null);
      setUser(null);
      return;
    }
    await syncApiUser(session.access_token);
  }, [configured, syncApiUser]);

  useEffect(() => {
    if (!configured) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      try {
        if (error) throw error;
        if (data.session) {
          await syncApiUser(data.session.access_token);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }
      // Keep the API bearer token aligned with Supabase's automatic refresh.
      void syncApiUser(session.access_token)
        .catch(() => {
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured, syncApiUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      if (!data.session) throw new Error("No Supabase session was created");
      return syncApiUser(data.session.access_token);
    },
    [syncApiUser],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim(), full_name: name.trim() },
        },
      });
      if (error) throw error;
      if (!data.session) {
        return { user: null, needsEmailConfirmation: true };
      }
      const appUser = await syncApiUser(data.session.access_token);
      return { user: appUser, needsEmailConfirmation: false };
    },
    [syncApiUser],
  );

  const loginWithProvider = useCallback(async (provider: "google" | "discord") => {
    const supabase = getSupabaseBrowserClient();
    const locale = window.location.pathname.split("/")[1] === "en" ? "en" : "ar";
    const redirectTo = `${window.location.origin}/${locale}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    if (!configured) return;
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    if (error) throw error;
  }, [configured]);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await getSupabaseBrowserClient().auth.updateUser({
      password,
    });
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      login,
      register,
      loginWithProvider,
      logout,
      refresh,
      updatePassword,
    }),
    [
      user,
      loading,
      configured,
      login,
      register,
      loginWithProvider,
      logout,
      refresh,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
