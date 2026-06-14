
"""
Document ingestion pipeline using LangChain abstractions.

Flow:
  1. Load PDF pages as LangChain Document objects (PyPDFLoader)
  2. Split into overlapping chunks (RecursiveCharacterTextSplitter)
  3. Inject metadata so we can filter by document/workspace later
  4. Hand everything to PGVector — it handles embedding (via VoyageAI) and storage

LangChain's PGVector will create two tables in your Postgres database the
first time it connects, if they don't already exist:

  langchain_pg_collection
    A registry of named vector stores. Each unique collection_name gets
    one row. We use a single collection ("documents") for everything and
    scope queries via metadata filters.

  langchain_pg_embedding
    The actual chunk storage. Columns:
      - id (uuid)
      - collection_id (FK to langchain_pg_collection)
      - embedding (vector)
      - document (text) — the raw chunk text
      - cmetadata (jsonb) — arbitrary dict you attach to each Document
      - custom_id (text) — optional, we use our chunk's UUID here

    The cmetadata column is the bridge back to your own schema.
    We store document_id, workspace_id, filename, and page_number there
    so that retrieval in rag.py can filter to the right documents.
"""

import json
from datetime import datetime, timezone
from uuid import UUID, uuid4
import httpx

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from sqlmodel import Session

from app.config import settings
from app.api.deps import get_sync_db
from app.models import Document, User
from app.database import engine
from app.dependancies import embeddings
from sqlalchemy import text
from sqlmodel import Session

from app.dependancies import vector_store

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    add_start_index=True,
    separators=["\n\n", "\n", ".", "•", " ", ""]
)


# ---------------------------------------------------------------------------
# Ingestion pipeline
# ---------------------------------------------------------------------------

def ingest_document(document_id: UUID, db: Session) -> None:
    """
    Full ingestion pipeline for a single document.

    This is designed to be called from a background task (e.g. ARQ worker)
    because embedding a large PDF can take several seconds.

    Args:
        document_id: The UUID of a Document row that's already been saved
                     with status="pending".
        db:          A synchronous SQLModel session (ARQ tasks are sync-friendly).
    """
    doc = db.get(Document, document_id)
    if not doc:
        raise ValueError(f"Document {document_id} not found")

    try:
        # Mark as processing so the frontend can show a spinner.
        doc.status = "processing"
        db.commit()

    

        loader = PyPDFLoader(doc.file_url)
        pages = loader.load()

        if not any(p.page_content.strip() for p in pages):
            raise ValueError("No text could be extracted from this document.")

        chunks = splitter.split_documents(pages)

        # ------------------------------------------------------------------
        # Step 3: Inject your metadata
        # This is the critical step that makes scoped retrieval possible.
        # LangChain will store chunk.metadata as JSONB in cmetadata.
        chunk_ids = []
        for chunk in chunks:
            chunk_id = str(uuid4())
            chunk_ids.append(chunk_id)
            chunk.metadata.update({
                "document_id": str(document_id),
                "workspace_id": str(doc.workspace_id),
                "filename": doc.filename,
                # "page" is already in metadata from PyPDFLoader (0-indexed).
                # We rename it to page_number for clarity in citations.
                "page_number": chunk.metadata.get("page", 0) + 1,
                "chunk_id": chunk_id,
            })

        # ------------------------------------------------------------------
        # Step 4: Embed + Store

        # ------------------------------------------------------------------
        vector_store.add_documents(chunks, ids=chunk_ids)

        # ------------------------------------------------------------------
        # Step 5: Update the Document record

        # ------------------------------------------------------------------
        doc.status = "ready"
        doc.chunk_count = len(chunks)
        doc.processed_at = datetime.now(timezone.utc)
        db.commit()

    except Exception as e:
        doc.status = "failed"
        doc.error_message = str(e)
        db.commit()
        raise



def delete_document_vectors(document_id: UUID) -> None:
    """
    Deletes all vectors for a document directly from langchain_pg_embedding.

    PGVector has no filter-based delete API, so we query the table directly.
    This is intentional — langchain_pg_embedding is just a Postgres table,
    and raw SQL is cleaner than trying to work around missing LangChain methods.
    """

    with get_sync_db() as sync_db:
        sync_db.exec(
            text("""
                DELETE FROM langchain_pg_embedding
                WHERE cmetadata->>'document_id' = :document_id
            """),
             params={"document_id": str(document_id)},
        )
        sync_db.commit()
