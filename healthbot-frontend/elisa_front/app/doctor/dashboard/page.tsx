// app/doctor/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import DoctorSidebar from "../../../components/DoctorSidebar";
import DashboardKpis from "../../../components/DashboardKpis";
import CriticalAlerts from "../../../components/CriticalAlerts";
import PatientRiskScores from "../../../components/PatientRiskScores";
import { fetchAlertsForDoctor, fetchKpisForDoctor, fetchRiskScoresForDoctor } from "../../../lib/doctorData";

export default function DoctorDashboardPage() {
  const { auth } = useAuth();
  const doctorName = auth?.profile?.name ?? auth?.user?.email ?? "Doctor";

  const [kpis, setKpis] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const did = auth?.profile?.id ?? auth?.user?.id ?? "";
        // replace these with your real API calls if available
        const [k, a, r] = await Promise.all([
          fetchKpisForDoctor(did),
          fetchAlertsForDoctor(did),
          fetchRiskScoresForDoctor(did),
        ]);
        setKpis(k);
        setAlerts(a);
        setRisks(r);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [auth]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6fbff" }}>
      <DoctorSidebar doctorName={doctorName} />

      <div style={{ flex: 1, padding: 24 }}>
        <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0 }}>Dashboard</h1>
            <div style={{ color: "#6b7280" }}>Real-time intelligence for patient care and safety</div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <DashboardKpis kpis={kpis} loading={loading} />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 20,
          alignItems: "start",
        }}>
          <div>
            <CriticalAlerts alerts={alerts} loading={loading} />
          </div>

          <aside>
            <PatientRiskScores risks={risks} loading={loading} />
          </aside>
        </div>
      </div>
    </div>
  );
}
