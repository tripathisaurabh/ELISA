import json
from app.core.openai_client import ask_gpt
from app.services.share_service import validate_share_session
from app.core.supabase_client import supabase_auth, supabase_db


def extract_meds(text: str):
    prompt = f"""
Extract all medicine names from the following report.
Return ONLY a JSON array of strings.
{text}
"""
    raw = ask_gpt(prompt)
    try:
        return json.loads(raw)
    except:
        return [raw]


def check_conflicts_for_share(share_id: str):
    session = validate_share_session(share_id)
    if not session:
        raise ValueError("Invalid or expired share session")

    report_id = session["report_id"]

    # Get report text
    res = (
        supabase.table("reports")
        .select("text_content")
        .eq("id", report_id)
        .single()
        .execute()
    )

    if not res.data:
        raise ValueError("Report not found")

    text = res.data["text_content"]

    meds = extract_meds(text)

    conflict_prompt = f"""
Check for drug–drug interactions among these medicines:
{meds}

List:
- Interactions
- Risks
- Warnings
- Disclaimer

Write clearly for doctors.
"""
    conflict = ask_gpt(conflict_prompt)
    return meds, conflict
