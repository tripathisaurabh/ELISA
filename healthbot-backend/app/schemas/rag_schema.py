from pydantic import BaseModel
from typing import List


class RagChatRequest(BaseModel):
    share_id: str
    question: str


class RagChatResponse(BaseModel):
    answer: str


class MedConflictRequest(BaseModel):
    share_id: str


class MedConflictResponse(BaseModel):
    extracted_medicines: List[str]
    conflict_analysis: str
