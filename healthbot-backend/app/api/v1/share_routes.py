# app/api/v1/share_routes.py

from fastapi import APIRouter, HTTPException
from app.core.supabase_client import supabase_db
from app.schemas.share_schema import ShareRequest, ShareResponse
from app.services.share_service import create_share_session, validate_share_session

router = APIRouter(prefix="/share", tags=["share"])

@router.post("/patient/{patient_id}", response_model=ShareResponse)
def share_patient_records(patient_id: str, payload: ShareRequest):

    # Validate patient exists
    patient_res = (
        supabase_db.table("patients")
        .select("*")
        .eq("id", patient_id)
        .execute()
    )
    if not patient_res.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Validate doctor exists
    doctor_res = (
        supabase_db.table("doctors")
        .select("*")
        .eq("id", payload.doctor_id)
        .execute()
    )
    if not doctor_res.data:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Create share session that only stores patient + doctor (NO REPORT ID)
    session = create_share_session(
        patient_id=patient_id,
        doctor_id=payload.doctor_id,
        minutes=15
    )

    return ShareResponse(
        share_id=session["id"],
        valid_till=session["expires_at"],
    )


@router.get("/session/{share_id}")
def get_share_session(share_id: str):
    session = validate_share_session(share_id)
    if not session:
        raise HTTPException(404, "Invalid or expired share session")

    return {
        "share_id": share_id,
        "patient_id": session["patient_id"],
        "doctor_id": session["doctor_id"]
    }
