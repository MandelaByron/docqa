from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, String, UniqueConstraint, func
from sqlmodel import Field, Relationship, SQLModel

#from app.models.user import User
#from app.models.workspace import Workspace

class WorkspaceMember(SQLModel, table=True):
    """Maps users to workspaces with a tenant role."""

    __tablename__ = "workspace_member"
    __table_args__ = (UniqueConstraint("workspace_id", "user_id"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    workspace_id: UUID = Field(foreign_key="workspace.id", nullable=False, index=True)
    user_id: UUID = Field(foreign_key="user.id", nullable=False, index=True)
    role: str = Field(
        default="member", sa_column=Column(String, nullable=False, server_default="member")
    )
    joined_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        )
    )

    workspace: "Workspace" = Relationship(back_populates="members")
    user: "User" = Relationship(back_populates="workspace_memberships")
