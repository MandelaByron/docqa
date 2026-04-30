from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4
from typing import List
from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, Relationship, SQLModel, Text
from pgvector.sqlalchemy import Vector


class User(SQLModel, table=True):
    """Represents an authenticated DocQA account."""

    __tablename__ = "user"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    clerk_user_id: str = Field(
        sa_column=Column(String, unique=True, index=True, nullable=False)
    )
    email: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))

    full_name : Optional[str] = Field(sa_column=Column(String, nullable=True))

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

    workspaces: list["Workspace"] = Relationship(back_populates="owner" ,cascade_delete=True)

    #workspace_memberships: List["WorkspaceMember"] = Relationship(back_populates="user")

class Workspace(SQLModel, table=True):
    """Represents an isolated tenant workspace."""

    __tablename__ = "workspace"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    owner_id: UUID = Field(foreign_key="user.id", nullable=False, index=True, ondelete='CASCADE')
    name: str = Field(sa_column=Column(String, nullable=False))
    plan: str = Field(default="free", nullable=False)
    doc_count: int = Field(default=0, nullable=False)
    storage_quota_bytes: int = Field(default=524288000, nullable=False)
    is_personal: bool = Field(default=True, nullable=False)
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

    owner: "User" = Relationship(back_populates="workspaces")


class Document(SQLModel, table=True):
    """
    Represents an uploaded document belonging to a workspace.
    LangChain's PGVector owns the actual chunk+embedding storage in its own
    tables (langchain_pg_collection, langchain_pg_embedding). This model
    tracks upload metadata, processing status, and acts as the source of truth
    for the document lifecycle — not the vector content itself.
    """
    __tablename__ = "documents"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    workspace_id: UUID = Field(foreign_key="workspace.id", nullable=False, index=True)
    uploaded_by: UUID = Field(foreign_key="user.id", nullable=False)

    filename: str = Field(nullable=False)
    file_path: str = Field(nullable=False)
    mime_type: str = Field(nullable=False)
    size_bytes: int = Field(nullable=False, default=0)

    # pending → processing → ready | failed
    status: str = Field(nullable=False, default="pending")
    error_message: Optional[str] = Field(default=None)
    chunk_count: int = Field(nullable=False, default=0)

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
    processed_at: Optional[datetime] = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True)
    )

    # Relationships — DocumentChunk is gone, LangChain owns that layer.
    workspace: Workspace | None = Relationship()

    # NOTE: No `chunks` relationship anymore. If you ever need to delete
    # a document's vectors, you'll query langchain_pg_embedding directly
    # by filtering cmetadata->>'document_id'. See ingestion.py for a helper.

