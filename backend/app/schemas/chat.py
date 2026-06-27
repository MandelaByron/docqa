from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime
from uuid import UUID
from app.models.user import MessageRole, MessageStatus
from .documents import DocumentRead

class ChatCreate(BaseModel):
    title: str
 
 
class ChatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: UUID
    title: str
    created_at: datetime
    documents: list[DocumentRead]

class MessageCreate(BaseModel):
    """Single message — used internally if needed."""
    role: MessageRole
    ui_message: dict[str, Any]
    parent_message_id: Optional[UUID] = None
 
 
class MessageBatchSave(BaseModel):
    """
    Payload from saveChat() in the frontend.
    onFinish sends the full UIMessage[] conversation history —
    we replace all messages for this chat in one call.
    """
    messages: list[dict[str, Any]]
 
 
class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: UUID
    chat_id: UUID
    role: MessageRole
    status: MessageStatus
    ui_message: dict[str, Any]
    parent_message_id: Optional[UUID]
    prompt_tokens: Optional[int]
    completion_tokens: Optional[int]
    total_tokens: Optional[int]
    created_at: datetime

