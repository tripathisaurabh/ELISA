"use client";
import React, { useEffect, useState } from "react";
import { getPatientReports, ReportItem } from "../lib/api";

type Props = {
  patientId: string;
};

export default function ReportsList({ patientId }: Props) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!patientId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await getPatientReports(patientId);
      setReports(data);
    } catch (e: any) {
      setErr(e.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Reports</h4>
        <button onClick={load} style={{ padding: "6px 10px", background: "#eef2ff", borderRadius: 6, border: "1px solid #e6eefc", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {!loading && reports.length === 0 && <div style={{ color: "#6b7280" }}>No reports found for this patient.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {reports.map((r) => (
          <div key={r.id || r.file_url} style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.04)" }}>
            <div style={{ fontWeight: 700 }}>{r.filename}</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>{r.doc_type ?? "—"}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
              {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              {r.file_url && (
                <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ padding: "8px 10px", background: "#2563eb", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
                  View
                </a>
              )}
              <button onClick={() => navigator.clipboard.writeText(r.file_url || "")} style={{ padding: "8px 10px", borderRadius: 8 }}>
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
