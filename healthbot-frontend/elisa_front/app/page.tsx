// app/page.tsx
import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <div style={{ minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "56px 20px" }}>
      <div style={{
        width: "100%",
        maxWidth: 1200,
        textAlign: "center",
        padding: "40px 28px",
        borderRadius: 12,
        background: "linear-gradient(180deg, #eaf6ff 0%, #f6fbff 100%)"
      }}>
        <div style={{ marginBottom: 18, fontSize: 13, color: "#0ea5a6", fontWeight: 600 }}>Built for ABDM - India's National Health Stack</div>

        <h1 style={{
          fontSize: 44,
          margin: "10px 0 18px",
          lineHeight: 1.05,
          color: "#0f172a",
          fontWeight: 800
        }}>
          Intelligent Clinical Co-Pilot<br />
          <span style={{ color: "#2563eb" }}>for Modern Healthcare</span>
        </h1>

        <p style={{ maxWidth: 820, margin: "0 auto 28px", color: "#475569", fontSize: 18 }}>
          Agentic AI that transforms fragmented patient records into unified clinical intelligence — highlighting drug interactions, risks, and trends in seconds.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 36 }}>
          <Link href="/doctor/dashboard" style={{ textDecoration: "none" }}>
            <button style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              background: "#2563eb",
              color: "white",
              borderRadius: 10,
              border: "none",
              fontWeight: 700,
              cursor: "pointer"
            }}>
              <span>Launch Dashboard</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5l7 7-7 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </Link>

          <Link href="/patient/dashboard" style={{ textDecoration: "none" }}>
            <button style={{
              padding: "12px 18px",
              borderRadius: 10,
              background: "white",
              border: "1px solid rgba(15,23,42,0.06)",
              color: "#0f172a",
              fontWeight: 700,
              cursor: "pointer"
            }}>
              View Patients
            </button>
          </Link>
        </div>

        {/* Stats cards */}
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { title: "< 10s", subtitle: "Clinical Summary Generation" },
            { title: "100%", subtitle: "ABDM Compliant" },
            { title: "0", subtitle: "Data Storage" },
            { title: "24/7", subtitle: "Decision Support" },
          ].map((c, i) => (
            <div key={i} style={{
              minWidth: 180,
              padding: 18,
              borderRadius: 12,
              background: "white",
              boxShadow: "0 8px 20px rgba(16,24,40,0.08)",
              textAlign: "center",
              marginTop: 12
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2563eb" }}>{c.title}</div>
              <div style={{ marginTop: 8, color: "#64748b" }}>{c.subtitle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
