const API_BASE = "http://localhost:8000";

// Read ?token=abc123 from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (!token) {
  alert("Missing doctor token in URL!");
}

// Load patient & reports
async function loadDoctorView() {
  const res = await fetch(`${API_BASE}/api/doctor/visit/${token}`);
  const data = await res.json();

  // --- Patient Info ---
  const p = data.patient;
  document.getElementById("patientInfo").innerHTML = `
    <h3 class="text-xl font-bold">Patient Details</h3>
    <p><strong>Name:</strong> ${p.name}</p>
    <p><strong>Email:</strong> ${p.email || "-"}</p>
    <p><strong>Phone:</strong> ${p.phone || "-"}</p>
    <p><strong>Age:</strong> ${p.age || "-"}</p>
    <p><strong>Gender:</strong> ${p.gender || "-"}</p>
  `;

  // --- Reports ---
  const container = document.getElementById("reportsContainer");
  container.innerHTML = "";

  let mergedSummary = "";
  let mergedStructured = {
    diagnosis: [],
    medications: [],
    allergies: [],
    notes: []
  };

  data.reports.forEach((r) => {
    // Add to page
    container.innerHTML += `
      <div class="bg-white shadow rounded p-4">
        <h4 class="text-lg font-semibold">Report</h4>
        <p class="text-gray-700 text-sm">Uploaded: ${new Date(r.created_at).toLocaleString()}</p>
        <a href="${r.file_url}" target="_blank" class="text-blue-600 underline">View Original</a>

        <details class="mt-3">
          <summary class="cursor-pointer">View Summary</summary>
          <p class="mt-2 bg-gray-100 p-3 rounded whitespace-pre-line">${r.summary}</p>
        </details>
      </div>
    `;

    // Build combined data for doctor
    try {
      const parsed = JSON.parse(r.structured_json);
      mergedStructured.diagnosis.push(...(parsed.diagnosis || []));
      mergedStructured.allergies.push(...(parsed.allergies || []));
      mergedStructured.notes.push(...(parsed.notes || []));
      mergedStructured.medications.push(...(parsed.medications || []));
    } catch {}
    
    mergedSummary += r.summary + "\n\n";
  });

  // Save for chatbot use
  window.patientContext = {
    structured: mergedStructured,
    summary: mergedSummary
  };
}

loadDoctorView();

// --- Doctor Chat ---
async function askDoctorBot() {
  const question = document.getElementById("doctorQuestion").value;
  if (!question.trim()) return alert("Type your question.");

  document.getElementById("chatResult").innerHTML =
    `<p class="text-green-600">Thinking...</p>`;

  const res = await fetch(`${API_BASE}/api/doctor-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      question,
      structured_data: window.patientContext.structured,
      report_summary: window.patientContext.summary
    }),
  });

  const data = await res.json();

  document.getElementById("chatResult").innerHTML = `
    <h4 class="text-lg font-bold">Answer</h4>
    <p class="bg-gray-100 p-3 rounded whitespace-pre-line">${data.answer}</p>
  `;
}
