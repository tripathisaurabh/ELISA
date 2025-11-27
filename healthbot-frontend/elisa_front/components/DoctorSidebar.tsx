// components/DoctorSidebar.tsx
"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function DoctorSidebar({ doctorName }: { doctorName: string }) {
  const { logout } = useAuth();

  return (
    <aside style={{
      width: 260,
      background: "#ffffff",
      borderRight: "1px solid rgba(0,0,0,0.04)",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#eef2ff", color: "#2563eb", fontWeight: 700
        }}>
          {doctorName?.[0]?.toUpperCase() ?? "D"}
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{doctorName}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Physician</div>
        </div>
      </div>

      <nav style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* NOTE: Link must not contain <a> child in the new Next.js Link API */}
        <Link href="/doctor/dashboard" style={navLinkStyle(true)}>Dashboard</Link>
        <Link href="/doctor/patients" style={navLinkStyle(false)}>Patients</Link>
        <Link href="/doctor/interactions" style={navLinkStyle(false)}>Drug Interactions</Link>
        <Link href="/doctor/alerts" style={navLinkStyle(false)}>Critical Alerts</Link>
      </nav>

      <div style={{ marginTop: "auto" }}>
        <button onClick={() => logout()} style={{
          width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eefc", background: "#fff", cursor: "pointer"
        }}>
          Logout
        </button>
      </div>
    </aside>
  );
}

function navLinkStyle(active = false): React.CSSProperties {
  return {
    display: "block",
    padding: "10px 12px",
    borderRadius: 8,
    background: active ? "#eef2ff" : "transparent",
    color: active ? "#1e3a8a" : "#374151",
    textDecoration: "none",
    fontWeight: 600
  };
}
