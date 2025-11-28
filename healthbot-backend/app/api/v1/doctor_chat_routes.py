from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.share_service import validate_share_session
from app.services.rag_service import (
    answer_doctor_query,
    get_latest_summary_for_chat,
    generate_opening_message
)
from app.services.chat_service import (
    get_chat_history,
    save_chat_message
)

router = APIRouter(prefix="/doctor/chat", tags=["doctor-chat"])


# ============================================================
#           1️⃣ Doctor Opens Chat Window
# ============================================================
@router.get("/open/{share_id}")
def open_chat(share_id: str):
    session = validate_share_session(share_id)

    if not session:
        raise HTTPException(403, "Session expired or invalid")

    # Latest structured summary for the patient
    summary_data = get_latest_summary_for_chat(session)

    # Convert summary → doctor-friendly natural opening
    opening_msg = generate_opening_message(summary_data)

    # Fetch existing chat history (if any)
    history = get_chat_history(share_id)

    return {
        "message": "Chat opened",
        "summary": summary_data,
        "opening_text": opening_msg,
        "history": history
    }


# ============================================================
#           2️⃣ Doctor Asks Question (RAG)
# ============================================================
class Query(BaseModel):
    question: str


@router.post("/{share_id}")
def doctor_chat(share_id: str, body: Query):
    session = validate_share_session(share_id)

    if not session:
        raise HTTPException(403, "Session expired or invalid")

    # Load chat history → used as memory
    history = get_chat_history(share_id)

    # RAG Answer from patient's records
    answer = answer_doctor_query(session, body.question, history)

    # Save chat messages
    save_chat_message(share_id, "doctor", body.question)
    save_chat_message(share_id, "bot", answer)

    return {"answer": answer}
