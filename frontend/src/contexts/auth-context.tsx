"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AuthUser, restoreSession, login as apiLogin, logout as apiLogout } from "@/lib/api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let alive = true;
    restoreSession()
      .then((u) => { if (alive) setUser(u); })
      .finally(() => { if (alive) setInitialized(true); });
    return () => { alive = false; };
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    const result = await apiLogin(email, password);
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  async function refreshUser() {
    const u = await restoreSession();
    setUser(u);
  }

  return (
    <AuthContext.Provider value={{ user, initialized, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
