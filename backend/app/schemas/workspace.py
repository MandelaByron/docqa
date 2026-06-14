from datetime import datetime
from typing import Optional
from uuid import UUID
from .documents import DocumentRead
from .chat import ChatRead
from pydantic import BaseModel, ConfigDict


class WorkspaceBase(BaseModel):
    """Shared workspace fields."""
    name: str


class WorkspaceCreate(BaseModel):
    """Payload to create a workspace, with optional slug override."""
    name: str
    is_personal: bool = False


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
    chats: list[ChatRead]
    #docs: list[DocumentRead]



class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None