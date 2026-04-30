# app/api/v1/documents.py
import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_current_user, get_async_db, get_sync_db
from app.models import User, Document
from app.schemas.documents import DocumentRead, AskRequest, CitationRead
from app.services import storage, ingestion, rag

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
}


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=DocumentRead, status_code=201)
async def upload_document(
    workspace_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Saves the file to disk and returns immediately with status='pending'.
    Ingestion (chunking + embedding) runs in the background.
    Poll GET /documents/{id} to check when status becomes 'ready'.
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Create the DB record first so we have a stable ID for the storage path.
    doc = Document(
        workspace_id=workspace_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        file_path="",           # filled in after save
        mime_type=file.content_type,
        status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    file_path, size = await storage.save_upload(file, workspace_id, doc.id)
    doc.file_path = file_path
    doc.size_bytes = size
    await db.commit()

    # -------------------------------------------------------------------------
    # We capture doc.id and doc.file_path as plain values here, inside the
    # request, before the async session closes. The background task then opens
    # its own fresh SYNC session (via get_sync_db) so it's not racing against
    # the request lifecycle. Never pass the request's db session into a
    # background task — it will be closed by the time the task runs.
    # -------------------------------------------------------------------------
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


# ── Ask (RAG) ─────────────────────────────────────────────────────────────────

@router.post("/ask")
async def ask_question(
    body: AskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Streams an LLM answer grounded in the selected documents.

    SSE response format:
      data: {"type": "citations", "data": [...]}   ← sent first, before any tokens
      data: {"type": "delta",     "data": "token"} ← repeated N times
      data: {"type": "done"}                        ← signals end of stream
    """
    # Verify documents exist and are ready before starting the expensive stream.
    for doc_id in body.document_ids:
        doc = await db.get(Document, doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document {doc_id} not found")
        if doc.status != "ready":
            raise HTTPException(
                status_code=409,
                detail=f"Document '{doc.filename}' is not ready (status: {doc.status})",
            )

    # rag.ask() returns the (stream_generator, citations) tuple immediately.
    # The generator is lazy — Claude doesn't start generating until the
    # event_generator below begins iterating over it.
    stream, citations = await rag.ask(body.question, body.document_ids, db)

    async def event_generator():
        # Citations go first so the frontend can render source chips
        # before the answer text starts arriving.
        yield f"data: {json.dumps({'type': 'citations', 'data': [c.model_dump(mode='json') for c in citations]})}\n\n"

        async for token in stream:
            yield f"data: {json.dumps({'type': 'delta', 'data': token})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")