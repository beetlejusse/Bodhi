"""User profile synchronization endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.api.auth import require_auth
from src.api.deps import get_storage
from src.storage import BodhiStorage

router = APIRouter(prefix="/api/users", tags=["users"])


class UserSyncResponse(BaseModel):
    user_id: str
    clerk_user_id: str


class UserStatusResponse(BaseModel):
    user_id: str
    clerk_user_id: str
    has_resume: bool


@router.post("/me", response_model=UserSyncResponse)
async def upsert_current_user(
    clerk_user_id: str = Depends(require_auth),
    storage: BodhiStorage = Depends(get_storage),
):
    user_id = storage.ensure_user_profile_for_clerk(clerk_user_id)
    return UserSyncResponse(user_id=user_id, clerk_user_id=clerk_user_id)


@router.get("/me", response_model=UserSyncResponse)
async def get_current_user(
    clerk_user_id: str = Depends(require_auth),
    storage: BodhiStorage = Depends(get_storage),
):
    user_id = storage.get_user_profile_id_by_clerk_user_id(clerk_user_id)
    if not user_id:
        user_id = storage.ensure_user_profile_for_clerk(clerk_user_id)
    return UserSyncResponse(user_id=user_id, clerk_user_id=clerk_user_id)


@router.get("/me/status", response_model=UserStatusResponse)
async def get_current_user_status(
    clerk_user_id: str = Depends(require_auth),
    storage: BodhiStorage = Depends(get_storage),
):
    status = storage.get_user_profile_status_by_clerk_user_id(clerk_user_id)
    if not status:
        user_id = storage.ensure_user_profile_for_clerk(clerk_user_id)
        return UserStatusResponse(
            user_id=user_id,
            clerk_user_id=clerk_user_id,
            has_resume=False,
        )
    user_id, has_resume = status
    return UserStatusResponse(
        user_id=user_id,
        clerk_user_id=clerk_user_id,
        has_resume=has_resume,
    )
