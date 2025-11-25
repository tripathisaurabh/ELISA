"""Local SQLite helpers for patient/report data."""
import json
import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./healthsnap.db")

if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL[len("sqlite:///"):]
else:
    db_path = DATABASE_URL

if not os.path.isabs(db_path):
    db_path = os.path.join(BASE_DIR, db_path)

DB_PATH = os.path.abspath(db_path)


def get_connection():
    conn = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _ensure_shared_reports_table():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shared_reports (
                token TEXT PRIMARY KEY,
                patient_id TEXT,
                doctor_id TEXT,
                report_id TEXT,
                created_at TEXT
            )
            """
        )
        conn.commit()


def _row_to_dict(row):
    if not row:
        return None
    result = dict(row)
    if result.get("created_at"):
        try:
            result["created_at"] = datetime.fromisoformat(result["created_at"])
        except ValueError:
            pass
    return result


def get_patient(patient_id: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, email, phone, age, gender FROM patients WHERE id = ?",
            (patient_id,),
        ).fetchone()
        return _row_to_dict(row)


def get_reports_for_patient(patient_id: str):
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, patient_id, file_url, report_type, structured_json, summary, created_at
            FROM reports
            WHERE patient_id = ?
            ORDER BY created_at DESC
            """,
            (patient_id,),
        ).fetchall()
        return [_row_to_dict(row) for row in rows if row]


def insert_report(
    report_id: str,
    patient_id: str,
    file_url: str,
    summary: str,
    structured_data: dict,
    report_type: str | None = None,
) -> str:
    created_at = datetime.utcnow().isoformat()
    structured_json = json.dumps(structured_data or {})
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO reports (id, patient_id, file_url, report_type, structured_json, summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (report_id, patient_id, file_url, report_type, structured_json, summary, created_at),
        )
        conn.commit()
    return created_at


def insert_shared_report(token: str, patient_id: str, doctor_id: str, report_id: str) -> str:
    created_at = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO shared_reports (token, patient_id, doctor_id, report_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (token, patient_id, doctor_id, report_id, created_at),
        )
        conn.commit()
    return created_at


_ensure_shared_reports_table()
