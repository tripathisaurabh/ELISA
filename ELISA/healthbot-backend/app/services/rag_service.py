from app.core.supabase_clients import supabase_db
from app.core.openai_client import ask_gpt
from app.services.share_service import validate_share_session


def rag_chat(share_id: str, question: str):
    """
    RAG Chat handler used when a doctor opens a shared report link.
    Validates share session, fetches report text, builds a grounded prompt,
    and queries the GPT assistant. Also saves the Q/A in chat history.
    """

    # 1️⃣ Validate sharing session expiry (15 min validity)
    session = validate_share_session(share_id)
    if not session:
        raise ValueError("Invalid or expired share session")

    report_id = session["report_id"]
    doctor_id = session["doctor_id"]
    patient_id = session["patient_id"]

    # 2️⃣ Fetch the report text from Supabase
    res = (
        supabase_db
        .table("reports")
        .select("text_content")
        .eq("id", report_id)
        .single()
        .execute()
    )

    if not res.data:
        raise ValueError("Report not found")

    text_content = res.data.get("text_content") or ""

    # 3️⃣ Construct safe medical RAG prompt
    prompt = (
        "You are assisting a doctor by reading a patient's medical report.\n\n"
        "Patient Report:\n"
        f"{text_content}\n\n"
        "Doctor's Question:\n"
        f"{question}\n\n"
        "Guidelines:\n"
        "- Give insights ONLY based on the medical report.\n"
        "- Do NOT guess information that is not in the report.\n"
        "- Do NOT provide a final diagnosis.\n"
        "- Give helpful observations, abnormalities, trends, and summaries.\n"
    )

    # 4️⃣ Query the GPT model
    answer = ask_gpt(prompt)

    # 5️⃣ Save chat history for this share session
    try:
        supabase_db.table("doctor_chat_history").insert({
            "share_id": share_id,
            "doctor_id": doctor_id,
            "patient_id": patient_id,
            "report_id": report_id,
            "question": question,
            "answer": answer,
        }).execute()
    except Exception as e:
        # Don't break the chat if logging fails – just log server-side
        print("Chat history insert failed:", e)

    return answer


# ==============================
# (Optional) Advanced RAG helpers
# ==============================

from app.core.openai_client import ask_gpt


def get_latest_summary_for_chat(session):
    batch_ids = session["batch_ids"]  # array of batch ids allowed
    patient_id = session["patient_id"]

    # Fetch latest batch
    res = (
        supabase_db
        .table("report_batches")
        .select("*")
        .in_("id", batch_ids)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not res.data:
        return {}

    batch = res.data[0]

    return {
        "merged_yearwise": batch["merged_yearwise"],
        "doc_type": batch["doc_type"],
        "date": batch["date"],
        "batch_id": batch["id"]
    }


def generate_opening_message(summary):
    prompt = f"""
    Convert this medical summary into a short 3-5 line doctor-friendly brief.

    Summary Data:
    {summary}

    Output: A concise natural-language explanation.
    """
    return ask_gpt(prompt)


def answer_doctor_query(session, question):
    # Step 1: JSON-first
    summary = get_latest_summary_for_chat(session)
    merged = summary.get("merged_yearwise", {})

    json_prompt = f"""
    You are a medical assistant.
    Using ONLY the JSON patient history below, answer this question if possible.

    JSON:
    {merged}

    Question: {question}

    If JSON does NOT contain answer, reply with EXACT string: "INSUFFICIENT".
    """

    r1 = ask_gpt(json_prompt)
    if "INSUFFICIENT" not in r1.upper():
        return r1

    # Step 2: structured_json from individual files
    batch_id = summary["batch_id"]
    res = (
        supabase_db
        .table("structured_json")
        .select("json")
        .eq("batch_id", batch_id)
        .execute()
    )

    structured = [item["json"] for item in res.data]

    semi_prompt = f"""
    Using ONLY this structured medical data:
    {structured}

    Question: {question}

    If still not found, reply "INSUFFICIENT".
    """

    r2 = ask_gpt(semi_prompt)
    if "INSUFFICIENT" not in r2.upper():
        return r2

    # Step 3: fallback OCR text
    text_res = (
        supabase_db
        .table("reports")
        .select("text_content")
        .eq("batch_id", batch_id)
        .execute()
    )
    texts = [t["text_content"] for t in text_res.data]

    ocr_prompt = f"""
    Use this OCR text data to answer the question:

    OCR TEXT:
    {texts}

    Question: {question}

    If still unclear, do full reasoning but note uncertainty.
    """

    return ask_gpt(ocr_prompt)
