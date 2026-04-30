from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.auth_utils import get_current_user
from ..db import get_db
from ..models.slides_archive_models import (
    DeckDeleteResponse,
    DeckDetailResponse,
    DeckListResponse,
    DeckUpdateRequest,
)
from ..models.sql_models import User
from ..services.archive.slides_archive_service import (
    get_deck_with_slides,
    list_user_decks,
    remove_deck,
    modify_deck,
)

slides_archive_router = APIRouter()


@slides_archive_router.get("/slides/archive", response_model=DeckListResponse)
def list_slides_archive(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckListResponse:
    return list_user_decks(db=db, user_id=current_user.id)


@slides_archive_router.get("/slides/archive/{deck_id}", response_model=DeckDetailResponse)
def get_slides_archive_deck(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckDetailResponse:
    return get_deck_with_slides(db=db, deck_id=deck_id, user_id=current_user.id)


@slides_archive_router.put("/slides/archive/{deck_id}", response_model=DeckDetailResponse)
def update_slides_archive_deck(
    deck_id: UUID,
    request: DeckUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckDetailResponse:
    slides_data = [slide.dict() for slide in request.slides]
    return modify_deck(db=db, deck_id=deck_id, user_id=current_user.id, slides_data=slides_data)


@slides_archive_router.delete("/slides/archive/{deck_id}", response_model=DeckDeleteResponse)
def delete_slides_archive_deck(
    deck_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DeckDeleteResponse:
    return remove_deck(db=db, deck_id=deck_id, user_id=current_user.id)
