from fastapi import APIRouter, HTTPException
from app.services.share_service import validate_share_session
from app.services.rag_service import (
    get_latest_summary_for_chat,
    generate_opening_message
)
from app.services.chat_service import get_chat_history

router = APIRouter(prefix="/doctor/chat", tags=["doctor-chat"])


# Doctor opens the chat window
@router.get("/open/{share_id}")
def open_chat(share_id: str):
    session = validate_share_session(share_id)
    
    if not session:
        raise HTTPException(403, "Session expired or invalid")

    # fetch the structured patient summary restricted to allowed batches only
    summary_data = get_latest_summary_for_chat(session)

    # natural language greeting summary
    opening_msg = generate_opening_message(summary_data)

    history = get_chat_history(share_id)

    return {
        "message": "Chat opened",
        "summary": summary_data,
        "opening_text": opening_msg,
        "history": history
    }

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.share_service import validate_share_session
from app.services.rag_service import answer_doctor_query
from app.services.chat_service import save_chat_message

router = APIRouter(prefix="/doctor/chat", tags=["doctor-chat"])


class Query(BaseModel):
    question: str


@router.post("/{share_id}")
def doctor_chat(share_id: str, body: Query):
    session = validate_share_session(share_id)
    if not session:
        raise HTTPException(403, "Session expired / invalid")

    answer = answer_doctor_query(session, body.question)

    save_chat_message(share_id, "doctor", body.question)
    save_chat_message(share_id, "bot", answer)

    return {"answer": answer}
