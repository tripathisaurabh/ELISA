import os
import uuid
import json
import base64
import tempfile
from typing import Dict
from fastapi import UploadFile
from io import BytesIO
from pdf2image import convert_from_bytes

from app.core.supabase_clients import supabase_db
from app.core.openai_client import ask_gpt, client


BUCKET = "medical-reports"


# =====================================================================
# 1. UPLOAD FILE TO SUPABASE STORAGE
# =====================================================================
async def upload_report_to_supabase(file: UploadFile) -> str:
    """
    Uploads PDF or image file to Supabase Storage.
    Returns the PUBLIC URL.
    """

    filename = f"{uuid.uuid4()}_{file.filename}"
    file_bytes = await file.read()

    res = supabase_db.storage.from_(BUCKET).upload(
        path=filename,
        file=file_bytes,
        file_options={"content_type": file.content_type},
    )

    if hasattr(res, "error") and res.error:
        raise Exception(f"Supabase storage upload failed: {res.error}")

    base_url = os.getenv("SUPABASE_URL")
    return f"{base_url}/storage/v1/object/public/{BUCKET}/{filename}"


# =====================================================================
# 2. CLEAN MEDICAL SUMMARY — removes useless address/website/etc.
# =====================================================================
def generate_clean_summary(text: str) -> str:
    prompt = f"""
    You are a medical report analyzer.

    Extract ONLY clinically important details from the following text:
    - Patient name
    - Doctor name
    - Date
    - Diagnosis / reason for visit
    - Recommended treatment options
    - Cost estimates
    - Any important medical notes

    DO NOT include:
    - Clinic addresses
    - Website links
    - Footer text
    - Emails
    - Phone numbers unless directly part of treatment instructions

    Return a clean, short medical summary in plain text (no markdown).

    OCR Text:
    {text}
    """

    summary = ask_gpt(prompt).strip()
    return summary


# =====================================================================
# 3. SAVE METADATA INTO REPORTS TABLE
# =====================================================================
def save_report_metadata(
    patient_id: str,
    filename: str,
    file_url: str,
    text: str,
    doc_type: str | None = None,
):
    """
    Saves basic metadata + full OCR text into reports table.

    Matches schema:
    id           uuid
    patient_id   uuid
    text_content text
    summary      text
    file_url     text
    filename     text
    storage_path text
    doc_type     text
    """

    data = {
        "patient_id": patient_id,
        "filename": filename,
        "file_url": file_url,
        "storage_path": file_url,
        "doc_type": doc_type,
        "text_content": text,   # full OCR text
        "summary": text,        # same for now
    }

    res = supabase_db.table("reports").insert(data).execute()

    if not res.data:
        raise Exception("Insert into reports table failed")

    return res.data[0]



# =====================================================================
# 4. STRUCTURED JSON EXTRACTION
# =====================================================================
def extract_medical_json(text: str) -> Dict:
    prompt = f"""
    Convert the medical text below into structured JSON.

    Required fields:
    - patient_name
    - doctor_name
    - visit_date
    - diagnosis
    - recommended_treatments (list)
    - cost_estimates (list)
    - notes

    Return ONLY JSON. No markdown, no backticks.

    Text:
    {text}
    """

    raw = ask_gpt(prompt).strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except:
        return {"raw_output": raw, "parse_error": True}


# =====================================================================
# 5. SAVE STRUCTURED RECORD INTO medical_records
# =====================================================================
def save_medical_record(patient_id: str, summary: str, file_url: str):
    data = {
        "patient_id": patient_id,
        "summary": summary,
        "file_url": file_url,
    }

    res = supabase_db.table("medical_records").insert(data).execute()
    if not res.data:
        raise Exception("Insert into medical_records failed")

    return res.data[0]


# =====================================================================
# 6. FETCH PATIENT REPORTS
# =====================================================================
def get_reports_for_patient(patient_id: str):
    res = (
        supabase_db.table("reports")
        .select("*")
        .eq("patient_id", patient_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


# =====================================================================
# 7. OCR (PDF & IMAGE) via GPT-4o-mini using base64 images
# =====================================================================
def _extract_from_image_bytes(img_bytes: bytes, content_type: str) -> str:
    """
    Helper: send image bytes to GPT for OCR.
    """
    img_b64 = base64.b64encode(img_bytes).decode()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Extract ALL visible text from this medical report "
                            "image including doctor, patient, diagnosis, treatment "
                            "and pricing details."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{content_type};base64,{img_b64}"},
                    },
                ],
            }
        ],
        max_tokens=8000,
    )

    return response.choices[0].message.content.strip()


# =====================================================================
# 8. PDF OR IMAGE → TEXT
# =====================================================================
def extract_text_from_file(file_bytes: bytes, content_type: str) -> str:
    """
    Extract all text from:
    - PDF → page images → GPT OCR
    - Images → GPT OCR
    """

    # IMAGES
    if content_type in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
        return _extract_from_image_bytes(file_bytes, content_type)

    # PDF
    elif content_type == "application/pdf":
        pages_text = []

        try:
            pages = convert_from_bytes(file_bytes, dpi=200)
        except Exception as e:
            return f"OCR failed: Could not convert PDF → images ({e})"

        for idx, page in enumerate(pages):
            buf = BytesIO()
            page.save(buf, format="PNG")
            img_bytes = buf.getvalue()

            page_text = _extract_from_image_bytes(img_bytes, "image/png")
            pages_text.append(page_text)

        return "\n\n".join(pages_text).strip()

    else:
        return f"Unsupported file type: {content_type}"
