
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user import Chat, Document, Message, MessageRole, MessageStatus

from app.schemas.chat import ChatCreate, ChatRead, MessageRead, MessageBatchSave
from app.api.deps import get_current_user, get_async_db
from app.models.user import User

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("/", response_model=ChatRead, status_code=201)
async def create_or_get_chat(
    payload: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Idempotent — if a chat already exists for this document, return it.
    This makes 'Start chatting' safe to call multiple times without
    creating duplicate records.

    Returns 404 if the document doesn't exist or doesn't belong to the
    current user (via the uploaded_by check).
    """
    # Verify the document exists and belongs to this user
    doc_result = await db.execute(
        select(Document).where(
            Document.id == payload.document_id,
            Document.uploaded_by == current_user.id,
        )
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # Return existing chat if one already exists for this document
    existing = await db.execute(
        select(Chat).where(Chat.document_id == payload.document_id)
    )
    chat = existing.scalar_one_or_none()
    if chat:
        return chat

    # Derive a title from the document filename if none was provided
    title = payload.title or _title_from_filename(doc.filename)

    chat = Chat(
        document_id=payload.document_id,
        created_by=current_user.id,
        title=title,
    )
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return chat

@router.get("/fetch_chats", response_model=list[ChatRead])
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Returns all chats belonging to the current user, ordered newest first.
    Scoped via created_by — users only see their own chats.
    """
    result = await db.execute(
        select(Chat)
        .where(Chat.created_by == current_user.id)
        .order_by(Chat.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{chat_id}", response_model=ChatRead)
async def get_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Fetch a single chat by ID. Used by the chat page on load to confirm
    the session exists before rendering the conversation UI.
    """
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )
    return chat


# ─── Message endpoints ────────────────────────────────────────────────────────
@router.get("/{chat_id}/messages", response_model=list[MessageRead])
async def get_messages(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Load full message history for a chat, ordered oldest first.
    The frontend feeds this into useChat's initialMessages on mount
    to restore the conversation across sessions.
    """
    await _get_owned_chat(chat_id, current_user.id, db)
 
    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()

@router.post("/{chat_id}/messages", status_code=204)
async def save_message(
    chat_id: UUID,
    payload: MessageBatchSave,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Persist a single message. Called by the frontend:
      - immediately when the user submits (role=user)
      - after streaming completes with the full assistant response (role=assistant)
    """
    await _get_owned_chat(chat_id, current_user.id, db)

    # Delete existing messages for this chat
    await db.execute(
        delete(Message).where(Message.chat_id == chat_id)
    )
 
    # Insert the full history from the SDK
    for ui_msg in payload.messages:
        message = Message(
            chat_id=chat_id,
            user_id=current_user.id if ui_msg.get("role") == "user" else None,
            role=MessageRole(ui_msg.get("role", "user")),
            ui_message=ui_msg,
            status=MessageStatus.COMPLETED,
        )
        db.add(message)
    await db.commit()

# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_owned_chat(chat_id: UUID, user_id: UUID, db: AsyncSession) -> Chat:
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.created_by == user_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")
    return chat

def _title_from_filename(filename: str) -> str:
    """
    'quarterly_report_Q3.pdf' → 'quarterly report Q3'
    Strips the extension and replaces underscores/hyphens with spaces.
    """
    name = filename.rsplit(".", 1)[0]          # drop extension
    return name.replace("_", " ").replace("-", " ")