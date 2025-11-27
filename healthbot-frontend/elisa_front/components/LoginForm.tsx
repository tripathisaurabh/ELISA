// components/LoginForm.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useAuth } from "./AuthProvider";

export default function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function detectRoleFromResponse(res: any): string | null {
    if (!res) return null;

    // 1) top-level
    if (typeof res.role === "string") return res.role;

    // 2) profile object (doctor/patient row) may include role
    if (res.profile && typeof res.profile.role === "string") return res.profile.role;

    // 3) supabase/similar user metadata
    if (res.user && res.user.user_metadata) {
      const um = res.user.user_metadata;
      if (typeof um === "object" && um !== null && typeof um.role === "string") return um.role;
    }

    // 4) user.role directly
    if (res.user && typeof res.user.role === "string") return res.user.role;

    // 5) Heuristic: if profile contains doctor-specific fields -> treat as doctor
    // (speciality, clinic_name, experience)
    if (res.profile) {
      const p = res.profile;
      if (p.speciality || p.clinic_name || (p.experience !== undefined && p.experience !== null)) return "doctor";
    }

    // 6) fallback null
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      console.debug("LOGIN RESPONSE (full):", res);

      // persist session if available
      if (res?.session) {
        try { localStorage.setItem("session", JSON.stringify(res.session)); } catch (e) {}
      }

      // Build auth object and persist to AuthProvider
      const authObj = {
        user: res?.user ?? null,
        profile: res?.profile ?? null,
        role: res?.role ?? null,
        session: res?.session ?? null,
      };
      setAuth(authObj);

      // Detect role robustly
      const role = detectRoleFromResponse(res);
      console.debug("Detected role:", role);

      // Final redirect decision
      if (role === "doctor") {
        router.push("/doctor/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (error: any) {
      console.error("login error:", error);
      setErr(error?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ width: 360, background: "#fff", padding: 24, borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <h2 style={{ marginBottom: 12 }}>Welcome Back</h2>

      <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />

      {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}

      <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, background: "#2563eb", color: "#fff", borderRadius: 6 }}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
