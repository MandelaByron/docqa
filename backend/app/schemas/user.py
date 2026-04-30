from datetime import datetime
from typing import Optional
from uuid import UUID
from .workspace import WorkspaceRead, WorkspaceBase
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    """Shared user profile fields."""

    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Payload for creating a user from Clerk identity data."""

    clerk_user_id: str


class UserRead(UserBase):
    """User data returned to API clients."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan: str
    onboarding_completed: bool
    storage_used_bytes: int
    created_at: datetime

    workspaces: list[WorkspaceRead]


class UserUpdate(BaseModel):
    """Mutable user profile fields."""

    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
