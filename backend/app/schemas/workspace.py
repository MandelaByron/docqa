from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    """Shared workspace fields."""

    name: str
    slug: str


class WorkspaceCreate(BaseModel):
    """Payload to create a workspace, with optional slug override."""

    name: str
    slug: Optional[str] = None


class WorkspaceRead(WorkspaceBase):
    """Workspace data returned to API clients."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    plan: str
    doc_count: int
    storage_quota_bytes: int
    is_personal: bool
    created_at: datetime


class WorkspaceReadWithRole(WorkspaceRead):
    """Workspace response that includes the current user's role."""

    model_config = ConfigDict(from_attributes=True)

    role: str
