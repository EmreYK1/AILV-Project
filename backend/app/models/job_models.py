from uuid import UUID
from typing import Optional, Any
from pydantic import BaseModel

class JobCreateResponse(BaseModel):
    job_id: UUID
    status: str

class JobStatusResponse(BaseModel):
    job_id: UUID
    job_type: str
    status: str
    progress: int
    stage_label: Optional[str] = None
    result_data: Optional[Any] = None
    error_message: Optional[str] = None