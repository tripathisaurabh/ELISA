// components/PatientRiskScores.tsx
"use client";
import React from "react";

function riskBadge(risk: number) {
  if (risk >= 85) return { text: "Critical", color: "#fda4af" };
  if (risk >= 70) return { text: "High", color: "#fed7aa" };
  if (risk >= 50) return { text: "Medium", color: "#fde68a" };
  return { text: "Low", color: "#bbf7d0" };
}

export default function PatientRiskScores({ risks, loading }: { risks: any[], loading?: boolean }) {
  return (
    <div style={{ background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Patient Risk Scores</h4>
        <button style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e6eefc", background: "#fff" }}>View All</button>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && risks.length === 0 && <div style={{ color: "#6b7280" }}>No high-risk patients</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {risks.slice(0, 6).map((p: any) => {
          const b = riskBadge(p.risk);
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 8, background: "#fbfdff" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{(p.name || "P")[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{p.id}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800 }}>{p.risk}/100</div>
                <div style={{ marginTop: 6, padding: "4px 8px", borderRadius: 999, background: b.color, fontSize: 12 }}>{b.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
