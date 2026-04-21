from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserRead


class WorkspaceMemberRead(BaseModel):
    """Workspace membership record with nested user details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: "UserRead"


class WorkspaceMemberInvite(BaseModel):
    """Payload to invite a user into a workspace."""

    email: str
    role: str = "member"


class WorkspaceMemberUpdateRole(BaseModel):
    """Payload to update an existing member role."""

    role: str


WorkspaceMemberRead.model_rebuild()
