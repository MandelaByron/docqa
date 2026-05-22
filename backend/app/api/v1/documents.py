# app/api/v1/documents.py
import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession
import httpx

from app.api.deps import get_current_user, get_async_db, get_sync_db
from app.models import User, Document
from app.schemas.documents import DocumentRead, DocumentCreate
from app.services import storage, ingestion, rag


router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
}


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/process", response_model=DocumentRead, status_code=201)
async def process_document(
    workspace_id: UUID,
    payload: DocumentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Saves the file to disk and returns immediately with status='pending'.
    Ingestion (chunking + embedding) runs in the background.
    Poll GET /documents/{id} to check when status becomes 'ready'.
    """

    file_url = str(payload.url)
    size_bytes = 0

    try:
        async with httpx.AsyncClient() as client:
            head = await client.head(file_url, follow_redirects=True, timeout=10)
            content_length = head.headers.get("content-length")
            if content_length:
                size_bytes = int(content_length)
    except httpx.HTTPError:
        # Non-fatal — size will just show as 0 until we can back-fill it.
        pass

    # Create the DB record first so we have a stable ID for the storage path.
    doc = Document(
        workspace_id=workspace_id,
        uploaded_by=current_user.id,
        filename=payload.filename,
        file_url=file_url,        
        mime_type=payload.mime_type,
        size_bytes= size_bytes,
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    doc_id = doc.id

    def run_ingestion():
        """
        Thin wrapper that opens a dedicated sync session for the background task.
        ingest_document() is synchronous because LangChain's add_documents() is sync.
        """
        with get_sync_db() as sync_db:
            ingestion.ingest_document(doc_id, sync_db)

    background_tasks.add_task(run_ingestion)

    return doc


# ── List & retrieve ───────────────────────────────────────────────────────────

@router.get("/", response_model=list[DocumentRead])
async def list_documents(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    results = await db.exec(
        select(Document)
        .where(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
    )
    return results.all()


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Deletes the document record, its file on disk, and its vectors from
    LangChain's embedding table. All three must be cleaned up — orphaned
    vectors in langchain_pg_embedding won't cascade-delete on their own.
    """
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Remove vectors from LangChain's table first (while we still have the id)
    ingestion.delete_document_vectors(document_id = document_id)

    # 2. Remove file from disk
    await storage.delete_upload(doc.file_path)

    # 3. Remove the document row
    await db.delete(doc)
    await db.commit()

