from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4
from typing import List
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    """Represents an authenticated DocQA account."""

    __tablename__ = "user"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    clerk_user_id: str = Field(
        sa_column=Column[Any](String, unique=True, index=True, nullable=False)
    )
    email: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))
    avatar_url: Optional[str] = Field(default=None, nullable=True)
    plan: str = Field(default="free", nullable=False)
    storage_used_bytes: int = Field(default=0, nullable=False)
    onboarding_completed: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        )
    )
    updated_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        )
    )

    #workspaces: List["Workspace"] = Relationship(back_populates="owner")
    #workspace_memberships: List["WorkspaceMember"] = Relationship(back_populates="user")
