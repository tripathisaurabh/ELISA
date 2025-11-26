from fastapi import APIRouter, Depends, HTTPException
from app.services.rag_service import rag_chat
from app.services.conflict_service import check_conflicts_for_share
from app.schemas.rag_schema import (
    RagChatRequest,
    RagChatResponse,
    MedConflictRequest,
    MedConflictResponse
)

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/chat", response_model=RagChatResponse)
def chat_rag(payload: RagChatRequest):
    try:
        answer = rag_chat(payload.share_id, payload.question)
        return RagChatResponse(answer=answer)
    except ValueError as e:
        raise HTTPException(403, detail=str(e))


@router.post("/medicine-conflicts", response_model=MedConflictResponse)
def medicine_conflicts(payload: MedConflictRequest):
    try:
        meds, analysis = check_conflicts_for_share(payload.share_id)
        return MedConflictResponse(
            extracted_medicines=meds,
            conflict_analysis=analysis,
        )
    except ValueError as e:
        raise HTTPException(403, detail=str(e))
