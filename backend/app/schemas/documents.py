from pydantic import BaseModel, ConfigDict, HttpUrl
from uuid import UUID
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    id: UUID

class ChatWorkspaceUpdate(BaseModel):
    chat_id: UUID
class DocumentCreate(BaseModel):
    """
    Payload the frontend sends after Uploadthing completes the client-side upload.
    The three fields mirror exactly what Uploadthing's onClientUploadComplete
    callback exposes: file.ufsUrl, file.name, file.type.
    """
    url: HttpUrl
    filename: str
    mime_type: str
    
class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID | None = None
    file_url: str 
    filename: str
    mime_type: str
    size_bytes: int
    status: str
    chunk_count: int
    error_message: str | None = None
    created_at: datetime
    processed_at: datetime | None = None


class ChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    chunk_index: int
    content: str


class AskRequest(BaseModel):
    question: str
    document_ids: list[UUID] = []  # ← optional, defaults to empty list  


class CitationRead(BaseModel):
    chunk_id: UUID
    document_id: UUID
    filename: str
    page_number: int
    snippet: str               # the exact chunk text surfaced as the source
              # cosine similarity score


class AskResponse(BaseModel):
    answer: str
    citations: list[CitationRead]