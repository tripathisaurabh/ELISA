from fastapi import APIRouter, HTTPException
from app.schemas.rag_schema import (
    RagChatRequest,
    RagChatResponse,
    MedConflictRequest,
    MedConflictResponse
)

from app.services.conflict_service import check_conflicts_for_share
from app.services.share_service import validate_share_session
from app.services.chat_service import get_chat_history, save_chat_message
from app.services.rag_service import answer_doctor_query
from app.core.supabase_client import supabase_db

router = APIRouter(prefix="/rag", tags=["RAG"])
 

# ------------------------------------------------------------
# STRICT DOCTOR CHAT
# ------------------------------------------------------------
@router.post("/chat", response_model=RagChatResponse)
def chat_rag(payload: RagChatRequest):

    session = validate_share_session(payload.share_id)
    if not session:
        raise HTTPException(403, detail="Invalid or expired share session")

    history = get_chat_history(payload.share_id)

    answer = answer_doctor_query(session, payload.question, history)

    save_chat_message(payload.share_id, "doctor", payload.question)
    save_chat_message(payload.share_id, "bot", answer)

    return RagChatResponse(answer=answer)


# ------------------------------------------------------------
# MEDICINE CONFLICT CHECK
# ------------------------------------------------------------
@router.post("/medicine-conflicts", response_model=MedConflictResponse)
def medicine_conflicts(payload: MedConflictRequest):

    meds, analysis = check_conflicts_for_share(payload.share_id)

    return MedConflictResponse(
        extracted_medicines=meds,
        conflict_analysis=analysis,
    )


# ------------------------------------------------------------
# CHAT HISTORY
# ------------------------------------------------------------
@router.get("/history/{patient_id}/{doctor_id}")
def get_chat_history_route(patient_id: str, doctor_id: str):

    res = (
        supabase_db
        .table("doctor_chat_history")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("doctor_id", doctor_id)
        .order("created_at")
        .execute()
    )

    return {"messages": res.data}
