// app/patient/dashboard/page.tsx
"use client";
import React, { useState } from "react";
import UploadReports from "../../../components/UploadReports";
import ReportsList from "../../../components/ReportsList";

export default function PatientDashboardPage() {
  const [patientId, setPatientId] = useState<string>("");

  const [activeId, setActiveId] = useState<string>("");

  function onDoneUpload() {
    // trigger refresh by toggling activeId (ReportsList listens to patientId updates)
    setActiveId((s) => (s ? "" : patientId));
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Upload Patient Reports</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <input
            placeholder="Enter patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #e6eefc" }}
          />
        </div>
      </div>

      {patientId ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 }}>
          <div>
            <ReportsList patientId={patientId || ""} />
          </div>
          <div>
            <UploadReports patientId={patientId} onDone={onDoneUpload} />
          </div>
        </div>
      ) : (
        <div style={{ padding: 18, background: "#fff", borderRadius: 8 }}>
          Please enter a patient ID to view and upload reports.
        </div>
      )}
    </main>
  );
}
