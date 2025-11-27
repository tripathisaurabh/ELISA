"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api, RegisterPayload } from "../lib/api";
import { useAuth } from "./AuthProvider"; // new: use auth provider

export default function SignUpForm() {
  const router = useRouter();
  const { setAuth } = useAuth(); // get setAuth

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState<RegisterPayload>({
    name: "",
    email: "",
    password: "",
    role: "patient",
    phone: "",
    age: 0,
    gender: "",
    speciality: "",
    clinic_name: "",
    experience: 0,
  });

  function setField<K extends keyof RegisterPayload>(k: K, v: any) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccessMsg(null);

    // client-side checks for doctor
    if (form.role === "doctor") {
      if (!form.speciality || !form.clinic_name || form.experience === undefined) {
        setErr("Please fill speciality, clinic name and experience for doctors.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age || 0),
        experience: Number(form.experience || 0),
      };
      console.debug("signup payload", payload);

      const res = await api.register(payload);
      console.log("register response", res);
      setSuccessMsg("Account created successfully.");

      // Build auth object and persist via AuthProvider (if backend returned usable info)
      const authObj = {
        user: res?.user ?? (res?.auth_user_id ? { id: res.auth_user_id, email: payload.email } : null),
        profile: res?.profile ?? null,
        role: res?.role ?? payload.role,
        session: res?.session ?? null,
      };
      setAuth(authObj);

      // redirect based on backend role if provided
      const role = res?.role ?? payload.role;
      if (role === "doctor") router.push("/doctor/dashboard");
      else router.push("/patient/dashboard");
    } catch (error: any) {
      console.error("register failed", error);
      setErr(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  // simple inline styles to ensure black text in inputs and a cleaner card
  const inputStyle: React.CSSProperties = { width: "100%", padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #ddd", color: "#000", background: "#fff" };

  return (
    <form onSubmit={onSubmit} style={{ width: 420, background: "#fff", padding: 28, borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
      <h2 style={{ marginBottom: 12, color: "#111", fontSize: 20 }}>Create your Account</h2>

      <input style={inputStyle} placeholder="Full name" value={form.name} onChange={e => setField("name", e.target.value)} />
      <input style={inputStyle} placeholder="Email" type="email" value={form.email} onChange={e => setField("email", e.target.value)} />
      <input style={inputStyle} placeholder="Phone number" value={form.phone} onChange={e => setField("phone", e.target.value)} />
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <select style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ddd", background: "#fff" }} value={form.role} onChange={e => setField("role", e.target.value as any)}>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
        <input style={{ width: 80, padding: 10, borderRadius: 6, border: "1px solid #ddd" }} placeholder="Age" type="number" value={form.age ?? ""} onChange={e => setField("age", Number(e.target.value))} />
      </div>

      <input style={inputStyle} placeholder="Password" type="password" value={form.password} onChange={e => setField("password", e.target.value)} />

      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6, color: "#333" }}>Gender</div>
        <label style={{ marginRight: 12 }}><input type="radio" checked={form.gender === "Male"} onChange={() => setField("gender", "Male")} /> Male</label>
        <label style={{ marginRight: 12 }}><input type="radio" checked={form.gender === "Female"} onChange={() => setField("gender", "Female")} /> Female</label>
        <label><input type="radio" checked={form.gender === "Other"} onChange={() => setField("gender", "Other")} /> Other</label>
      </div>

      {form.role === "doctor" && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: "1px solid #eee", background: "#fafafa" }}>
          <input style={inputStyle} placeholder="Speciality" value={form.speciality} onChange={e => setField("speciality", e.target.value)} />
          <input style={inputStyle} placeholder="Clinic name" value={form.clinic_name} onChange={e => setField("clinic_name", e.target.value)} />
          <input style={inputStyle} placeholder="Experience (years)" type="number" value={form.experience ?? ""} onChange={e => setField("experience", Number(e.target.value))} />
        </div>
      )}

      {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}
      {successMsg && <div style={{ color: "green", marginBottom: 10 }}>{successMsg}</div>}

      <button type="submit" disabled={loading} style={{ width: "100%", padding: 12, borderRadius: 8, background: "#2563eb", color: "#fff", border: "none" }}>
        {loading ? "Creating..." : "Create Account"}
      </button>
    </form>
  );
}
