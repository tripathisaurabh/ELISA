# app/services/share_service.py
from datetime import datetime, timedelta
from app.core.supabase_clients import supabase_db


def create_share_session(report_id: str, patient_id: str, doctor_id: str, minutes: int = 15):
    """
    Create a share session for a report, valid for `minutes`.
    """
    expires = datetime.utcnow() + timedelta(minutes=minutes)

    payload = {
        "report_id": report_id,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "expires_at": expires.isoformat(),
        "is_active": True,
    }

    res = supabase_db.table("share_sessions").insert(payload).execute()

    if not res.data:
        raise ValueError("Failed to create share session")

    return res.data[0]


def validate_share_session(share_id: str):
    """
    Validate that a share session exists, is active, and not expired.
    """
    res = supabase_db.table("share_sessions").select("*").eq("id", share_id).execute()

    if not res.data:
        return None

    session = res.data[0]

    if not session.get("is_active", False):
        return None

    # expiry check
    expires_at = datetime.fromisoformat(session["expires_at"]).replace(tzinfo=None)
    now = datetime.utcnow()

    if expires_at < now:
        supabase_db.table("share_sessions").update({"is_active": False}).eq("id", share_id).execute()
        return None

    return session
