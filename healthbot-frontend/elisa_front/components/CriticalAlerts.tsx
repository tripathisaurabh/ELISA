// components/CriticalAlerts.tsx
"use client";
import React from "react";

function severityColor(level: string) {
  if (level === "Critical") return "#fef2f2"; // red bg
  if (level === "High") return "#fff7ed"; // orange
  return "#f8fafc"; // neutral
}

export default function CriticalAlerts({ alerts, loading }: { alerts: any[], loading?: boolean }) {
  return (
    <div style={{ background: "#fff", padding: 18, borderRadius: 12, boxShadow: "0 6px 20px rgba(18,38,63,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Critical Alerts</h3>
        <button style={{ border: "1px solid #e6eefc", padding: "6px 10px", borderRadius: 8, background: "#fff" }}>View All</button>
      </div>

      {loading && <div>Loading alerts...</div>}

      {!loading && alerts.length === 0 && <div style={{ color: "#6b7280" }}>No alerts found</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((a: any) => (
          <div key={a.id} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 10, background: severityColor(a.severity), border: "1px solid rgba(0,0,0,0.03)" }}>
            <div style={{ width: 8, borderRadius: 6, background: a.severity === "Critical" ? "#ef4444" : a.severity === "High" ? "#f59e0b" : "#60a5fa" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{a.title}</div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>{a.summary}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(a.time).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "#2563eb", border: "1px solid #e6eefc", padding: "4px 8px", borderRadius: 6 }}>{a.tag}</div>
                <div style={{ marginLeft: "auto", fontSize: 12, color: a.severity === "Critical" ? "#b91c1c" : a.severity === "High" ? "#b45309" : "#065f46" }}>{a.severity}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
