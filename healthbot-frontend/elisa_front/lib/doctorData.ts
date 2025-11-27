// lib/doctorData.ts
export async function fetchKpisForDoctor(doctorId: string) {
    // replace with real API call to /doctors/{id}/kpis if you have
    return {
      totalPatients: 5,
      criticalAlerts: 2,
      drugInteractions: 3,
      highRisk: 3,
    };
  }
  
  export async function fetchAlertsForDoctor(doctorId: string) {
    // replace with a real API call to fetch critical alerts
    return [
      { id: "a1", title: "Aspirin-Atorvastatin Interaction", summary: "Moderate interaction detected between Aspirin 75mg and Atorvastatin 20mg. Increased bleeding risk.", time: new Date().toISOString(), tag: "Drug Interaction", severity: "Medium" },
      { id: "a2", title: "Critical: Allopurinol-Lisinopril Interaction", summary: "Major interaction in patient with CKD. High risk of hypersensitivity reactions.", time: new Date().toISOString(), tag: "Drug Interaction", severity: "Critical" },
      { id: "a3", title: "NSAIDs Contraindicated", summary: "Patient has NSAID allergy and CKD Stage 3. NSAIDs absolutely contraindicated.", time: new Date().toISOString(), tag: "Allergy", severity: "High" },
    ];
  }
  
  export async function fetchRiskScoresForDoctor(doctorId: string) {
    // replace with real API call
    return [
      { id: "p1", name: "Mohammed Ali", risk: 92 },
      { id: "p2", name: "Amit Patel", risk: 85 },
      { id: "p3", name: "Rajesh Kumar", risk: 78 },
      { id: "p4", name: "Priya Sharma", risk: 62 },
      { id: "p5", name: "Neha Gupta", risk: 48 },
    ];
  }
  