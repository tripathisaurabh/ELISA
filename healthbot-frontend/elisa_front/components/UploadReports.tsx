// components/UploadReports.tsx
"use client";
import React, { useRef, useState } from "react";

type Props = {
  patientId: string;
  onDone?: () => void;
};

export default function UploadReports({ patientId, onDone }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [docType, setDocType] = useState<string>("lab");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onFilesSelected(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    onFilesSelected(e.dataTransfer.files);
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }

  async function uploadAll() {
    if (!patientId) { setStatus("Please enter a patient ID first."); return; }
    if (files.length === 0) { setStatus("Pick files first."); return; }
    setStatus("Uploading...");
    setUploading(true);
    setProgress({});
    try {
      for (const f of files) {
        await uploadSingleFile(f);
      }
      setStatus("All uploads complete.");
      setFiles([]);
      if (onDone) onDone();
    } catch (e: any) {
      setStatus("Upload failed: " + (e.message || e));
    } finally { setUploading(false); }
  }

  function uploadSingleFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "")}/reports/patient/${encodeURIComponent(patientId)}/upload`;
      const fd = new FormData();
      fd.append("date", date);
      fd.append("doc_type", docType);
      fd.append("file", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setProgress((p) => ({ ...p, [file.name]: pct }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress((p) => ({ ...p, [file.name]: 100 }));
          resolve();
        } else {
          reject(new Error(`Upload failed ${xhr.status}: ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(fd);
    });
  }

  return (
    <div style={{ background: "#fff", padding: 20, borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.08)" }}>
      <h3 style={{ marginTop: 0 }}>Upload Patient Reports</h3>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onClick={() => inputRef.current?.click()}
        style={{ border: "2px dashed #e6eefc", padding: 24, borderRadius: 8, textAlign: "center", cursor: "pointer", background: "#fbfdff" }}
      >
        <div style={{ color: "#2563eb", fontWeight: 700, marginBottom: 8 }}>Drag & drop files here</div>
        <div style={{ marginBottom: 12 }}>or</div>
        <button type="button" onClick={() => inputRef.current?.click()} style={{ padding: "8px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
          Browse Files
        </button>
        <input ref={inputRef} type="file" style={{ display: "none" }} multiple onChange={(e) => onFilesSelected(e.target.files)} />
        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>Supported: PDF, DOCX, JPG, PNG</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, marginBottom: 12 }}>
        <input type="text" placeholder="Patient ID" value={patientId} readOnly style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #e6eefc" }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: 10, borderRadius: 6, border: "1px solid #e6eefc" }} />
        <select value={docType} onChange={(e) => setDocType(e.target.value)} style={{ padding: 10, borderRadius: 6, border: "1px solid #e6eefc" }}>
          <option value="lab">Lab</option>
          <option value="imaging">Imaging</option>
          <option value="prescription">Prescription</option>
          <option value="other">Other</option>
        </select>
      </div>

      {files.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {files.map((f) => (
            <div key={f.name} style={{ padding: 8, borderRadius: 6, border: "1px solid #f0f6ff", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{f.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{Math.round(f.size / 1024)} KB</div>
              </div>
              <div style={{ width: 220 }}>
                <div style={{ height: 8, background: "#edf2ff", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${progress[f.name] ?? 0}%`, height: "100%", background: "#2563eb" }} />
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{progress[f.name] ?? 0}%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={uploadAll} disabled={uploading || files.length === 0} style={{ padding: "10px 16px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
        <button onClick={() => { setFiles([]); setProgress({}); }} style={{ padding: "10px 12px", borderRadius: 8, background: "#f3f4f6", border: "1px solid #e6eefc" }}>
          Clear
        </button>
      </div>

      {status && <div style={{ marginTop: 12, color: status.startsWith("Upload failed") ? "crimson" : "green" }}>{status}</div>}
    </div>
  );
}
