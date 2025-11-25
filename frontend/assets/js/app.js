console.log("Frontend JS loaded!");

// IMPORTANT: Use localhost, NOT 127.0.0.1
const API_BASE = "http://localhost:8000";

// Stored patient data after upload
let patientData = null;
let patientSummary = null;

// TAB SWITCHING ----------------------------------

document.getElementById("uploadTab").onclick = () => {
  document.getElementById("uploadSection").classList.remove("hidden");
  document.getElementById("doctorSection").classList.add("hidden");

  document.getElementById("uploadTab").classList.add("bg-blue-600", "text-white");
  document.getElementById("uploadTab").classList.remove("bg-gray-300", "text-gray-700");

  document.getElementById("doctorTab").classList.remove("bg-blue-600", "text-white");
  document.getElementById("doctorTab").classList.add("bg-gray-300", "text-gray-700");
};

document.getElementById("doctorTab").onclick = () => {
  document.getElementById("uploadSection").classList.add("hidden");
  document.getElementById("doctorSection").classList.remove("hidden");

  document.getElementById("doctorTab").classList.add("bg-blue-600", "text-white");
  document.getElementById("doctorTab").classList.remove("bg-gray-300", "text-gray-700");

  document.getElementById("uploadTab").classList.remove("bg-blue-600", "text-white");
  document.getElementById("uploadTab").classList.add("bg-gray-300", "text-gray-700");
};


// UPLOAD REPORT -----------------------------------

async function uploadReport() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Please select a file first.");

  const formData = new FormData();
  formData.append("file", file);

  document.getElementById("uploadResult").innerHTML =
    `<p class="text-blue-600 font-semibold">Processing... Please wait 10–20 seconds...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/process-report`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      throw new Error("Backend returned an error");
    }

    const data = await res.json();

    patientData = data.structured_data;
    patientSummary = data.report_summary;

    document.getElementById("uploadResult").innerHTML = `
      <h3 class="text-xl font-semibold mb-2">Extracted Data</h3>
      <pre class="bg-gray-100 p-4 rounded-lg overflow-auto">${JSON.stringify(
        patientData, null, 2
      )}</pre>

      <h3 class="text-xl font-semibold mt-4 mb-2">Summary Report</h3>
      <div class="bg-gray-100 p-4 rounded-lg whitespace-pre-line">${patientSummary}</div>
    `;

  } catch (err) {
    console.error("Upload failed:", err);
    document.getElementById("uploadResult").innerHTML =
      `<p class="text-red-600">Error processing report.</p>`;
  }
}


// DOCTOR CHAT -------------------------------------

async function askDoctorBot() {
  const question = document.getElementById("doctorQuestion").value.trim();
  if (!question) return alert("Enter your question.");

  if (!patientData) return alert("Upload a patient's report first!");

  document.getElementById("chatResult").innerHTML =
    `<p class="text-green-600 font-semibold">Thinking...</p>`;

  try {
    const res = await fetch(`${API_BASE}/api/doctor-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        structured_data: patientData,
        report_summary: patientSummary,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      throw new Error("Backend error");
    }

    const data = await res.json();

    document.getElementById("chatResult").innerHTML = `
      <h3 class="text-xl font-semibold mb-2">Answer</h3>
      <div class="bg-gray-100 p-4 rounded-lg whitespace-pre-line">${data.answer}</div>
    `;

  } catch (err) {
    console.error("Chat failed:", err);
    document.getElementById("chatResult").innerHTML =
      `<p class="text-red-600">Error contacting doctor bot.</p>`;
  }
}
