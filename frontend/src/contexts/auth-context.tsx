"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { AuthUser, fetchMe, login as apiLogin, logout as apiLogout } from "@/lib/api/auth";

type AuthContextValue = {
  user: AuthUser | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((u) => { if (alive) setUser(u); })
      .finally(() => { if (alive) setInitialized(true); });
    return () => { alive = false; };
  }, []);

  async function login(email: string, password: string) {
    const result = await apiLogin(email, password);
    setUser(result.user);
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
