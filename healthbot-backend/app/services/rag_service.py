import os
from openai import OpenAI
from app.core.supabase_client import supabase_db

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ============================================================
#   SUMMARY FETCHER (SAFE, NO batch_ids NEEDED)
# ============================================================
def get_latest_summary_for_chat(session):
    """
    Returns a minimal summary dictionary.
    You can expand later when adding structured_json.
    """
    return {
        "summary": "Patient medical reports loaded.",
        "vitals": {}
    }


# ============================================================
#   NATURAL-LANGUAGE OPENING MESSAGE FOR DOCTOR
# ============================================================
def generate_opening_message(summary):
    text = f"""
    Convert this patient's summary into 2–3 line doctor greeting:

    SUMMARY:
    {summary}

    Output ONLY the greeting text.
    """
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": text}],
        max_tokens=80,
        temperature=0.3
    )
    return completion.choices[0].message.content.strip()


# ============================================================
#   DOCTOR QUERY ANSWER — SIMPLE RAG (NO VECTOR)
# ============================================================
def answer_doctor_query(session, question: str, history=None):

    patient_id = session["patient_id"]

    # Fetch latest report for the patient
    result = (
        supabase_db.table("reports")
        .select("text_content")
        .eq("patient_id", patient_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        return "No data available in the patient's records."

    report_text = result.data[0].get("text_content") or ""
    if not report_text.strip():
        return "No data available in the patient's records."

    # Build prompt
    history_text = ""
    if history:
        for msg in history[-6:]:  # last 6 messages only
            history_text += f"{msg['sender']}: {msg['message']}\n"

    prompt = f"""
    You are a clinical assistant.

    REPORT DATA:
    {report_text}

    CHAT HISTORY:
    {history_text}

    DOCTOR QUESTION:
    {question}

    RULES:
    - Answer ONLY from the report.
    - If answer cannot be found, say exactly:
      "No data available in the patient's records."
    - Keep answer short (max 2 lines).
    """

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100,
        temperature=0
    )

    answer = completion.choices[0].message.content.strip()

    # If GPT refuses but report had content:
    if "No data available" in answer and len(report_text) > 10:
        return "No clear information found in the report."

    return answer
