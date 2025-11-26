# app/api/v1/share_routes.py
from fastapi import APIRouter, HTTPException
from app.core.supabase_clients import supabase_db
from app.schemas.share_schema import ShareRequest, ShareResponse
from app.services.share_service import create_share_session

router = APIRouter(prefix="/share", tags=["share"])


@router.post("/patient/{patient_id}/report/{report_id}", response_model=ShareResponse)
def share_report(
    patient_id: str,
    report_id: str,
    payload: ShareRequest,
):
    # 1️⃣ Validate patient exists
    patient_res = (
        supabase_db
        .table("patients")
        .select("*")
        .eq("id", patient_id)
        .execute()
    )
    if not patient_res.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient = patient_res.data[0]

    # 2️⃣ Validate report exists and belongs to patient
    report_res = (
        supabase_db
        .table("reports")
        .select("*")
        .eq("id", report_id)
        .eq("patient_id", patient_id)
        .execute()
    )
    if not report_res.data:
        raise HTTPException(status_code=404, detail="Report not found or not linked to patient")

    report = report_res.data[0]

    # 3️⃣ Validate doctor exists
    doctor_res = (
        supabase_db
        .table("doctors")
        .select("*")
        .eq("id", payload.doctor_id)
        .execute()
    )
    if not doctor_res.data:
        raise HTTPException(status_code=404, detail="Doctor not found")

    doctor = doctor_res.data[0]

    # 4️⃣ Create share session (15 min default)
    session = create_share_session(
        report_id=report["id"],
        patient_id=patient["id"],
        doctor_id=doctor["id"],
        minutes=15,
    )

    return ShareResponse(
        share_id=session["id"],
        valid_till=session["expires_at"],
    )
