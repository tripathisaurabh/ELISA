# app/services/share_service.py
from datetime import datetime, timedelta
from app.core.supabase_client import supabase_db


import uuid
from datetime import datetime, timedelta
from app.core.supabase_client import supabase_db

def create_share_session(patient_id: str, doctor_id: str, minutes: int = 15):
    """Create a share session valid for X minutes."""

    share_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=minutes)

    payload = {
        "id": share_id,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "expires_at": expires_at.isoformat(),
    }

    supabase_db.table("share_sessions").insert(payload).execute()

    return payload

def validate_share_session(share_id: str):
    """Return session only if it is still valid."""

    result = (
        supabase_db.table("share_sessions")
        .select("*")
        .eq("id", share_id)
        .single()
        .execute()
    )

    session = result.data
    if not session:
        return None

    from datetime import datetime, timezone

    # Ensure both are timezone-aware UTC
    expires_at = datetime.fromisoformat(session["expires_at"])
    now = datetime.now(timezone.utc)

    if expires_at < now:
        return None


    return session
def get_share_patient_summary(session):
    """
    Wrapper function that extracts patient summary
    using the existing RAG summary utility.
    """
    from app.services.rag_service import get_latest_summary_for_chat
    return get_latest_summary_for_chat(session)
