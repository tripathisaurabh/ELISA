# app/schemas/share_schema.py
from pydantic import BaseModel
from datetime import datetime


class ShareRequest(BaseModel):
    doctor_id: str  # Supabase UUID


class ShareResponse(BaseModel):
    share_id: str   # share_sessions.id (UUID)
    valid_till: datetime

    class Config:
        orm_mode = True
