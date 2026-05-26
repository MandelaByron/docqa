from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4
from sqlalchemy import Column, DateTime, String, func, UniqueConstraint, Enum
from sqlmodel import Field, Relationship, SQLModel, Text
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import JSONB

from enum import StrEnum


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
    file_url: str = Field(nullable=True)
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


class Chat(SQLModel, table=True):
    """
    One chat session per document (enforced by the unique constraint on
    document_id). The chat ID becomes the stable URL slug — /chat/{id}.
 
    Message history is stored separately by the AI SDK on the frontend
    (or in a messages table when you add persistence). This record is
    purely the binding between a document and its conversation.
    """
    __tablename__ = "chats"
    __table_args__ = (
        # Enforce 1:1 at the DB level — not just application logic
        UniqueConstraint("document_id", name="uq_chat_document"),
    )
 
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    document_id: UUID = Field(foreign_key="documents.id", nullable=False, index=True)
    created_by: UUID = Field(foreign_key="user.id", nullable=False)
 
    # Auto-generated from the document filename if not provided
    title: str = Field(nullable=False)
 
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    )
 
    # Relationship — lazy by default, use selectinload if you need it in queries
    document: Optional["Document"] = Relationship()


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"

class MessageEventType(StrEnum):
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    SYSTEM_PROMPT = "system_prompt"
    RETRIEVAL = "retrieval"
    REASONING = "reasoning"
    STREAM_DELTA = "stream_delta"
class MessageStatus(StrEnum):
    PENDING = "pending"
    STREAMING = "streaming"
    COMPLETED = "completed"
    FAILED = "failed"

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    id : UUID = Field(default_factory=uuid4, primary_key=True)
    chat_id: UUID = Field(foreign_key="chats.id", nullable=False, index=True, ondelete="CASCADE")
    user_id : UUID | None = Field(foreign_key="user.id", default=None, index=True)


    status : MessageStatus = Field(
        sa_column=Column(Enum(MessageStatus))
    )
    role: MessageRole = Field(        
        sa_column=Column(              
            Enum(MessageRole),      
            index=True                 
            )
        )
    
    content: str = Field(sa_column=Column(String))

    ui_message: dict = Field(sa_column=Column(JSONB, nullable=False))

    pydantic_ai_message: dict = Field(
        sa_column=Column(JSONB, nullable=False),
        description="Serialized pydantic-ai ModelMessage for agent message_history",
    )

    created_at: datetime = Field(
    sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
)

    parent_message_id: Optional[UUID] = Field(
        foreign_key="messages.id",
        default=None,
        index=True,
    )
    prompt_tokens: Optional[int] = Field(
        default=None,
        ge=0,
    )

    completion_tokens: Optional[int] = Field(
        default=None,
        ge=0,
    )

    total_tokens: Optional[int] = Field(
        default=None,
        ge=0,
    )
# class MessageEvent(SQLModel, table=True):
#     __tablename__ = "message_events"
#     id: UUID = Field(default_factory=uuid4, primary_key=True)

#     message_id: UUID = Field(foreign_key="messages.id", nullable=False, index=True)

#     event_type : MessageEventType = Field(
#         sa_column=Column(Enum(MessageEventType))
#     )
#     payload: dict = Field(sa_column=Column(JSONB, nullable=False))

#     created_at: datetime = Field(
#      sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     )
