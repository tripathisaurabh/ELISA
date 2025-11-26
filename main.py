import os
import uuid
import json
import shutil
import base64
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

from sqlalchemy import (
    create_engine, Column, String, Integer, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# ---------------- ENV + OPENAI ----------------

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in .env")

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------------- FASTAPI APP ----------------

app = FastAPI(title="HealthSnap Clean Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # hackathon-friendly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE (SQLite) ----------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "healthsnap.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="patient")


class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    file_path = Column(String)       # local path
    summary = Column(Text)
    structured_json = Column(Text)   # JSON string
    report_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="reports")


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- Pydantic Schemas ----------------

class PatientCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class PatientOut(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    age: Optional[int]
    gender: Optional[str]

    class Config:
        from_attributes = True


class ReportOut(BaseModel):
    id: str
    report_type: Optional[str]
    created_at: datetime
    summary: str
    file_url: str

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    patient: PatientOut
    reports: List[ReportOut]


class DoctorChatRequest(BaseModel):
    question: str
    structured_data: Dict[str, Any]
    report_summary: Optional[str] = None


class DoctorChatResponse(BaseModel):
    answer: str

# ---------------- AI Helpers ----------------

def call_openai_structured_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Text-only structuring helper (kept if you later plug in classic OCR).
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a medical assistant. Extract diseases, medications, allergies, "
                "and important notes. Return strictly JSON with keys: "
                "diagnosis (list), medications (list), allergies (list), notes (list), summary (string)."
            ),
        },
        {
            "role": "user",
            "content": f"Text:\n{raw_text}",
        },
    ]

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = resp.choices[0].message.content
    try:
        return json.loads(content)
    except Exception:
        # fallback
        return {
            "diagnosis": [],
            "medications": [],
            "allergies": [],
            "notes": [raw_text],
            "summary": "Summary based on raw text only.",
        }


def call_openai_structured_from_image(image_bytes: bytes, patient_name: str, filename: str) -> Dict[str, Any]:
    """
    Vision-based structuring using the actual image (handwritten prescription, lab report, etc.).
    """
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:image/png;base64,{b64}"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert medical assistant. You are given a photo or scan of a medical document "
                "(often handwritten). Read everything carefully and extract:\n"
                "- diagnosis: list of conditions / problems / chief complaints\n"
                "- medications: list of treatments, braces, procedures, or aligner plans with any costs\n"
                "- allergies: list (empty if not mentioned)\n"
                "- notes: any additional important clinical info (doctor name, clinic, duration, etc.)\n"
                "- summary: 3–6 line doctor-friendly summary in plain English.\n\n"
                "Return strictly valid JSON only with keys: diagnosis, medications, allergies, notes, summary."
            ),
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"This document belongs to patient '{patient_name}'. The original file name is '{filename}'. "
                        "Please ignore decorative branding and focus on the handwritten/printed clinical content."
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": data_url},
                },
            ],
        },
    ]

    resp = client.chat.completions.create(
        model="gpt-4o",  # vision-capable model
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = resp.choices[0].message.content
    try:
        return json.loads(content)
    except Exception:
        # worst-case fallback
        return {
            "diagnosis": [],
            "medications": [],
            "allergies": [],
            "notes": ["Could not parse vision output reliably."],
            "summary": "AI could not confidently read this report.",
        }


def generate_summary(structured: Dict[str, Any]) -> str:
    """
    Extra summarizer if you ever want to regenerate a summary from structured JSON.
    If structured already contains 'summary', we normally just use that.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a medical summarization assistant. "
                "Generate a short, doctor-friendly summary (5–8 bullet points)."
            ),
        },
        {
            "role": "user",
            "content": f"JSON data:\n{json.dumps(structured, indent=2)}",
        },
    ]
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.2,
    )
    return resp.choices[0].message.content


def doctor_chat_answer(question: str, structured: Dict[str, Any], summary: Optional[str]) -> str:
    context = f"Structured data:\n{json.dumps(structured, indent=2)}\n\n"
    if summary:
        context += f"Summary:\n{summary}\n"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant for doctors. "
                "Answer only using the provided data. If something is missing, say "
                "'This information is not available in the records.'"
            ),
        },
        {
            "role": "user",
            "content": context + f"\nDoctor question:\n{question}",
        },
    ]
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.1,
    )
    return resp.choices[0].message.content

# ---------------- ROUTES ----------------


@app.get("/")
def root():
    return {"status": "ok", "message": "Clean HealthSnap backend running"}


# -------- PATIENT CREATION (for testing + real use) --------

@app.post("/api/patient", response_model=PatientOut)
def create_patient(payload: PatientCreate):
    from sqlalchemy.orm import Session
    db: Session = next(get_db())

    pid = str(uuid.uuid4())
    patient = Patient(
        id=pid,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        age=payload.age,
        gender=payload.gender,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


# -------- DASHBOARD --------

@app.get("/api/patient/{patient_id}/dashboard", response_model=DashboardResponse)
def get_dashboard(patient_id: str):
    from sqlalchemy.orm import Session
    db: Session = next(get_db())

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    reports = (
        db.query(Report)
        .filter(Report.patient_id == patient_id)
        .order_by(Report.created_at.desc())
        .all()
    )

    out_reports: List[ReportOut] = []
    for r in reports:
        file_url = f"/files/{os.path.basename(r.file_path)}"
        out_reports.append(
            ReportOut(
                id=r.id,
                report_type=r.report_type,
                created_at=r.created_at,
                summary=r.summary,
                file_url=file_url,
            )
        )

    return DashboardResponse(
        patient=patient,
        reports=out_reports,
    )


# -------- FILE UPLOAD + AI PROCESSING --------

@app.post("/api/patient/{patient_id}/upload-report")
async def upload_report(patient_id: str, file: UploadFile = File(...)):
    from sqlalchemy.orm import Session
    db: Session = next(get_db())

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Read file bytes once
    file_bytes = await file.read()

    # Save file locally from bytes
    ext = os.path.splitext(file.filename)[1] or ".bin"
    rid = str(uuid.uuid4())
    save_name = f"{rid}{ext}"
    save_path = os.path.join(UPLOAD_DIR, save_name)

    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # Use OpenAI Vision on the actual image bytes
    structured = call_openai_structured_from_image(
        image_bytes=file_bytes,
        patient_name=patient.name or "Unknown",
        filename=file.filename,
    )

    # Prefer model's own summary if present, else generate one
    summary = structured.get("summary") or generate_summary(structured)

    report = Report(
        id=rid,
        patient_id=patient_id,
        file_path=save_path,
        summary=summary,
        structured_json=json.dumps(structured),
        report_type=structured.get("report_type"),
    )
    db.add(report)
    db.commit()

    return {
        "report_id": rid,
        "summary": summary,
        "structured_data": structured,
    }


# -------- DOCTOR CHAT (frontend sends context) --------

@app.post("/api/doctor-chat", response_model=DoctorChatResponse)
def doctor_chat(payload: DoctorChatRequest):
    answer = doctor_chat_answer(
        question=payload.question,
        structured=payload.structured_data,
        summary=payload.report_summary,
    )
    return DoctorChatResponse(answer=answer)
