import tempfile
from typing import List, Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, Form

from app.services.report_service import (
    upload_report_to_supabase,
    save_report_metadata,
    get_reports_for_patient,
    save_medical_record,
    extract_medical_json,
    extract_text_from_file,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


# =====================================================================
# INTERNAL CORE HANDLER
# =====================================================================
async def _process_reports_upload(
    patient_id: str,
    date: str,
    doc_type: str,
    files: List[UploadFile],
) -> Dict[str, Any]:

    if not files:
        raise HTTPException(400, "No files uploaded")

    results = []
    merged_yearwise: Dict[str, Dict[str, Any]] = {}

    for file in files:

        print(f"\n--- Processing file: {file.filename} ---")

        # ---------------------------
        # SAFELY READ FILE BYTES
        # ---------------------------
        try:
            file_bytes = await file.read()
        except Exception as e:
            raise HTTPException(400, f"Failed to read file: {file.filename} ({e})")

        # Reset for Supabase upload
        try:
            file.file.seek(0)
        except:
            pass  # not critical

        # ---------------------------
        # 1) UPLOAD TO SUPABASE
        # ---------------------------
        try:
            file_url = await upload_report_to_supabase(file)
        except Exception as e:
            raise HTTPException(500, f"Storage upload failed: {e}")

        # ---------------------------
        # 2) OCR PROCESSING
        # Works for PDF, images, and ANY OTHER file type
        # ---------------------------
        try:
            text = extract_text_from_file(file_bytes, file.content_type)
        except Exception as e:
            text = f"OCR failed for {file.filename}: {e}"

        # ---------------------------
        # 3) SAVE RAW OCR + SUMMARY INTO REPORTS TABLE
        # ---------------------------
        try:
            report = save_report_metadata(
                patient_id=patient_id,
                filename=file.filename,
                file_url=file_url,
                text=text,
                doc_type=doc_type,
            )
        except Exception as e:
            raise HTTPException(500, f"Saving report metadata failed: {e}")

        # ---------------------------
        # 4) STRUCTURED DATA (LLM)
        # ---------------------------
        try:
            structured_json = extract_medical_json(text)
        except Exception:
            structured_json = {"error": "LLM parsing failed"}

        # ---------------------------
        # 5) SAVE STRUCTURED SUMMARY INTO medical_records
        # ---------------------------
        try:
            medical_record = save_medical_record(
                patient_id=patient_id,
                summary=text,
                file_url=file_url,
            )
        except Exception as e:
            raise HTTPException(500, f"Saving medical record failed: {e}")

        # ---------------------------
        # 6) YEAR-WISE MERGING
        # ---------------------------
        if isinstance(structured_json, dict):
            for year, metrics in structured_json.items():
                if isinstance(metrics, dict):
                    merged_yearwise.setdefault(year, {})
                    merged_yearwise[year].update(metrics)

        # ---------------------------
        # 7) FINAL RESULT ENTRY
        # ---------------------------
        results.append({
            "report": report,
            "structured": medical_record,
            "raw_json": structured_json,
        })

    return {
        "items": results,
        "merged_yearwise": merged_yearwise,
        "date": date,
        "doc_type": doc_type
    }


# =====================================================================
# SINGLE FILE UPLOAD
# =====================================================================
@router.post("/patient/{patient_id}/upload")
async def upload_report(
    patient_id: str,
    date: str = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...)
):
    result = await _process_reports_upload(
        patient_id=patient_id,
        date=date,
        doc_type=doc_type,
        files=[file],
    )

    item = result["items"][0]

    return {
        "message": "Report uploaded successfully",
        "report": item["report"],
        "structured": item["structured"],
        "raw_json": item["raw_json"],
        "merged_yearwise": result["merged_yearwise"],
        "date": result["date"],
        "doc_type": result["doc_type"],
    }


# =====================================================================
# MULTIPLE FILE UPLOAD
# =====================================================================
@router.post("/patient/{patient_id}/upload-multiple")
async def upload_multiple_reports(
    patient_id: str,
    date: str = Form(...),
    doc_type: str = Form(...),
    files: List[UploadFile] = File(...)
):

    result = await _process_reports_upload(
        patient_id=patient_id,
        date=date,
        doc_type=doc_type,
        files=files,
    )

    return {
        "message": "Reports uploaded successfully",
        "items": result["items"],
        "merged_yearwise": result["merged_yearwise"],
        "date": result["date"],
        "doc_type": result["doc_type"],
    }


# =====================================================================
# FETCH ALL REPORTS FOR A PATIENT
# =====================================================================
@router.get("/patient/{patient_id}")
def list_patient_reports(patient_id: str):
    return get_reports_for_patient(patient_id)
