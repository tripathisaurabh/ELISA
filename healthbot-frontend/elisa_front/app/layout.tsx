// app/layout.tsx
import Link from "next/link";
import "../styles/globals.css"; // adjust path if needed
import React from "react";
import { AuthProvider } from "../components/AuthProvider"; // new: provider

export const metadata = {
  title: "Clinical Co-Pilot",
  description: "Intelligent Clinical Co-Pilot for Modern Healthcare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial", background: "#f1f7fb" }}>
        <AuthProvider>
          <header style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px",
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(6px)",
            borderBottom: "1px solid rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Left cluster: Sign up / Login buttons */}
              <Link href="/signup" style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(37,99,235,0.15)",
                  background: "white",
                  color: "#2563eb",
                  fontWeight: 600,
                  cursor: "pointer"
                }}>Sign up</button>
              </Link>

              <Link href="/login" style={{ textDecoration: "none" }}>
                <button style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid transparent",
                  background: "transparent",
                  color: "#374151",
                  cursor: "pointer"
                }}>Login</button>
              </Link>
            </div>

            {/* center brand / logo */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>Clinical Co-Pilot</div>
            </div>

            {/* right placeholder to keep header symmetrical */}
            <div style={{ width: 88 }} />
          </header>

          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
