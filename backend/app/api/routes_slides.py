from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..models.slides_models import SlidesGenerateRequest, SlidesGenerateResponse
from ..models.generate_models import GenerateRequest
from ..models.slides_finalize_models import FinalizeSlidesRequest, FinalizeSlidesResponse
from ..services.validators.slides_request_validator import SlidesGenerateRequestValidator
from ..services.finalization.slides_finalize_service import finalize_slides
from ..core.auth_utils import get_current_user
from ..models.sql_models import User
from ..db import get_db
from ..persistence.generation_repo import create_generation_request_db
from ..services.generation.slides_orchestrator import generate_slides as run_generate_slides

slides_router = APIRouter(prefix="/slides")

def get_validator():
    return SlidesGenerateRequestValidator()

@slides_router.post("/generate", response_model=SlidesGenerateResponse)
async def generate_slides(
    req: SlidesGenerateRequest,
    validator: SlidesGenerateRequestValidator = Depends(get_validator),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validator.validate(req)
    return await run_generate_slides(req, db, user_id=current_user.id)

@slides_router.post("/finalize", response_model=FinalizeSlidesResponse)
async def finalize_slides_endpoint(
    req: FinalizeSlidesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return finalize_slides(db=db, req=req, user_id=current_user.id)