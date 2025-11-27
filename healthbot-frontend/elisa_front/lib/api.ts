// lib/api.ts
// Central API client used by the frontend.
// - request(): robust fetch wrapper with helpful errors
// - api.register / api.login : auth endpoints
// - getPatientReports : GET reports for a patient
// - uploadReports : upload multiple files in one request (XHR -> overall progress)
// - uploadSingleReport : upload single file (XHR -> per-file progress)

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    role: "doctor" | "patient";
    phone?: string;
    age?: number;
    gender?: string;
    speciality?: string;
    clinic_name?: string;
    experience?: number;
  };
  
  export type LoginPayload = { email: string; password: string };
  
  export type ReportItem = {
    id?: string;
    patient_id?: string;
    filename: string;
    file_url: string;
    text?: string;
    doc_type?: string;
    created_at?: string;
    // backend may supply additional fields
  };
  
  const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
  
  /**
   * Robust fetch wrapper:
   * - logs requests
   * - handles network/CORS failures
   * - parses JSON when content-type is application/json, otherwise returns text
   * - throws detailed errors for non-OK responses
   */
  async function request<T = any>(path: string, opts: RequestInit = {}) {
    const url = `${BASE}${path}`;
    console.debug("[api] request to", url, opts);
  
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
        // include credentials by default (adjust if you don't use cookies)
        credentials: "include",
        ...opts,
      });
    } catch (err: any) {
      // network / CORS failure
      console.error("[api] network error when fetching", url, err);
      throw new Error(`Network error: ${err?.message || err}`);
    }
  
    const ct = res.headers.get("content-type") || "";
    let body: any = null;
    if (ct.includes("application/json")) {
      try {
        body = await res.json();
      } catch (e: any) {
        console.error("[api] JSON parse failed for", url, e);
        throw new Error("Invalid JSON from server");
      }
    } else {
      body = await res.text();
    }
  
    if (!res.ok) {
      const msg = (body && (body.detail || body.message || JSON.stringify(body))) || res.statusText;
      console.error("[api] server returned error", res.status, msg);
      throw new Error(`API error ${res.status}: ${msg}`);
    }
  
    return body as T;
  }
  
  /* Auth endpoints */
  export const api = {
    register: (data: RegisterPayload) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: LoginPayload) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  };
  
  /* ============================
     Reports & Upload utilities
     ============================ */
  
  /**
   * Fetch reports for a patient.
   * Returns array of ReportItem or throws.
   */
  export async function getPatientReports(patientId: string): Promise<ReportItem[]> {
    if (!patientId) return [];
    const url = `${BASE}/reports/patient/${encodeURIComponent(patientId)}`;
    console.debug("[api] getPatientReports", url);
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch reports: ${res.status} ${text}`);
    }
    const data = await res.json();
    // Backend may return array directly or { items: [...]} or { reports: [...] }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.reports)) return data.reports;
    return [];
  }
  
  /**
   * Upload multiple files in a single request (overall progress).
   * onProgress: (loaded, total) — overall progress numbers (bytes)
   */
  export function uploadReports(
    patientId: string,
    date: string,
    docType: string,
    files: File[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!patientId) return reject(new Error("patientId required"));
      const url = `${BASE}/reports/patient/${encodeURIComponent(patientId)}/upload-multiple`;
      const fd = new FormData();
      fd.append("date", date);
      fd.append("doc_type", docType);
      files.forEach((f) => fd.append("files", f, f.name));
  
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      // keep withCredentials true only if your backend uses cookies & CORS allow_credentials=True
      xhr.withCredentials = true;
  
      xhr.upload.onprogress = function (ev) {
        if (ev.lengthComputable && onProgress) {
          onProgress(ev.loaded, ev.total);
        }
      };
  
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
              resolve(json);
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed ${xhr.status}: ${xhr.responseText}`));
          }
        }
      };
  
      xhr.onerror = function (err) {
        reject(new Error("Network error during upload"));
      };
  
      xhr.send(fd);
    });
  }
  
  /**
   * Upload a single file (per-file progress).
   * Useful to show per-file progress bars by uploading files one-by-one.
   */
  export function uploadSingleReport(
    patientId: string,
    date: string,
    docType: string,
    file: File,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!patientId) return reject(new Error("patientId required"));
      const url = `${BASE}/reports/patient/${encodeURIComponent(patientId)}/upload`;
      const fd = new FormData();
      fd.append("date", date);
      fd.append("doc_type", docType);
      fd.append("file", file, file.name);
  
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.withCredentials = true;
  
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && onProgress) {
          onProgress(ev.loaded, ev.total);
        }
      };
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            resolve(json);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed ${xhr.status}: ${xhr.responseText}`));
        }
      };
  
      xhr.onerror = () => reject(new Error("Network error during upload"));
  
      xhr.send(fd);
    });
  }
  
  export default {
    request,
    api,
    getPatientReports,
    uploadReports,
    uploadSingleReport,
  };
  