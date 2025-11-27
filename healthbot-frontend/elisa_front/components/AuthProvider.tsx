// components/AuthProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthState = {
  user?: any;       // backend `user` object
  profile?: any;    // backend profile (patient or doctor row)
  role?: string;    // "patient" | "doctor"
  session?: any;    // optional session/token
} | null;

type AuthContextType = {
  auth: AuthState;
  setAuth: (a: AuthState) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(null);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (raw) {
        setAuthState(JSON.parse(raw));
      }
    } catch (e) {
      console.warn("Auth hydrate failed:", e);
    }
  }, []);

  function setAuth(a: AuthState) {
    setAuthState(a);
    try {
      if (a) localStorage.setItem("auth", JSON.stringify(a));
      else localStorage.removeItem("auth");
    } catch (e) {
      console.warn("Failed to persist auth:", e);
    }
  }

  function logout() {
    setAuth(null);
    // optionally: call backend logout then redirect client-side
    // e.g. fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" })
  }

  return <AuthContext.Provider value={{ auth, setAuth, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
