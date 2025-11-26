from pydantic import BaseModel
from datetime import datetime


class UploadReportResponse(BaseModel):
    report_id: int
    filename: str
    text_preview: str

    class Config:
        orm_mode = True


class ReportOut(BaseModel):
    id: int
    filename: str
    created_at: datetime
    doc_type: str | None = None

    class Config:
        orm_mode = True
