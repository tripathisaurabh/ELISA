// components/DashboardKpis.tsx
"use client";
import React from "react";

export default function DashboardKpis({ kpis, loading }: { kpis: any, loading?: boolean }) {
  const cards = [
    { title: "Total Patients", value: kpis?.totalPatients ?? 5, note: "+12% this month" },
    { title: "Critical Alerts", value: kpis?.criticalAlerts ?? 2, note: "Requires immediate attention" },
    { title: "Drug Interactions", value: kpis?.drugInteractions ?? 3, note: "1 major" },
    { title: "High Risk Patients", value: kpis?.highRisk ?? 3, note: "Active monitoring" },
  ];

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {cards.map((c) => (
        <div key={c.title} style={{
          minWidth: 220,
          background: "#fff",
          padding: 18,
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(18, 38, 63, 0.04)",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>{c.title}</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{loading ? "..." : c.value}</div>
          <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}
