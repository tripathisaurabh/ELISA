const API_BASE = "http://localhost:8000";

// READ patient_id from URL
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get("pid");

if (!patientId) alert("No patient ID found! Add ?pid=<id> in URL.");

// Load patient + reports
async function loadDashboard() {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/dashboard`);
  const data = await res.json();

  // Patient info
  const p = data.patient;
  document.getElementById("patientInfo").innerHTML = `
    <h3 class="text-xl font-bold">Patient Details</h3>
    <p><strong>Name:</strong> ${p.name}</p>
    <p><strong>Email:</strong> ${p.email || "-"}</p>
    <p><strong>Phone:</strong> ${p.phone || "-"}</p>
    <p><strong>Age:</strong> ${p.age || "-"}</p>
    <p><strong>Gender:</strong> ${p.gender || "-"}</p>
  `;

  // Reports list
  const container = document.getElementById("reportsContainer");
  container.innerHTML = "";

  data.reports.forEach((r) => {
    container.innerHTML += `
      <div class="bg-white shadow rounded p-4">
        <h4 class="text-lg font-semibold">Report – ${r.report_type || "medical"}</h4>
        <p class="text-gray-700 text-sm">Uploaded: ${new Date(r.created_at).toLocaleString()}</p>

        <a href="${r.file_url}" target="_blank" class="text-blue-600 underline">
          View Original File
        </a>

        <details class="mt-3">
          <summary class="cursor-pointer font-semibold">View Summary</summary>
          <p class="mt-2 bg-gray-100 p-3 rounded whitespace-pre-line">${r.summary}</p>
        </details>
      </div>
    `;
  });
}

loadDashboard();


// ------------------- UPLOAD NEW REPORT -------------------

async function uploadReport() {
  const file = document.getElementById("reportFile").files[0];
  if (!file) return alert("Please choose a file!");

  const formData = new FormData();
  formData.append("file", file);

  document.getElementById("uploadStatus").innerHTML =
    "Uploading & processing... (10–20 sec)";

  const res = await fetch(`${API_BASE}/api/patients/${patientId}/upload-report`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById("uploadStatus").innerHTML =
      "✓ Report uploaded & processed successfully.";

    // Refresh UI
    loadDashboard();
  } else {
    document.getElementById("uploadStatus").innerHTML =
      "Error: " + data.detail;
  }
}


// ------------------- SHARE WITH DOCTOR -------------------

async function shareWithDoctor() {
  const res = await fetch(`${API_BASE}/api/patients/${patientId}/share`, {
    method: "POST"
  });

  const data = await res.json();

  document.getElementById("shareResult").innerHTML = `
    <strong>Share Link:</strong><br>
    <a href="${data.share_url}" target="_blank" class="text-blue-700 underline">
      ${data.share_url}
    </a><br>
    <span class="text-gray-600 text-sm">
      Expires: ${new Date(data.expires_at).toLocaleString()}
    </span>
  `;
}
