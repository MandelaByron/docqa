
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

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from sqlmodel import Session

from app.config import settings
from app.api.deps import get_sync_db
from app.models import Document
from app.database import engine
from app.dependancies import embeddings
from langchain_postgres import PGVector
from sqlalchemy import text
from sqlmodel import Session

# ---------------------------------------------------------------------------
# Shared LangChain components
# These are module-level singletons — no need to reinstantiate per request.
# ---------------------------------------------------------------------------

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="documents",
    connection=settings.database_url,  # ← plain sync URL string, correct for sync
    use_jsonb=True,
    create_extension=False
)



# Splitter config. These values are a reasonable starting point for PDFs.
# chunk_size is in characters. chunk_overlap keeps context across boundaries.
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

        # ------------------------------------------------------------------
        # Step 1: Load
        # PyPDFLoader reads the PDF page by page and returns a list of
        # LangChain Document objects. Each Document has:
        #   .page_content — the extracted text for that page
        #   .metadata     — {"source": "/path/to/file", "page": 0, ...}
        # ------------------------------------------------------------------
        loader = PyPDFLoader(doc.file_path)
        pages = loader.load()

        if not any(p.page_content.strip() for p in pages):
            raise ValueError("No text could be extracted from this document.")

        chunks = splitter.split_documents(pages)

        # ------------------------------------------------------------------
        # Step 3: Inject your metadata
        # This is the critical step that makes scoped retrieval possible.
        # LangChain will store chunk.metadata as JSONB in cmetadata.
        # In rag.py we'll filter on document_id and workspace_id to make
        # sure users only retrieve chunks from documents they own.
        #
        # We also assign a stable custom_id (UUID) to each chunk. PGVector
        # accepts an ids= list in add_documents() and stores it in the
        # custom_id column — useful if you ever need to delete specific chunks.
        # ------------------------------------------------------------------
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
        # add_documents() does three things internally:
        #   a) Calls embeddings.embed_documents([c.page_content for c in chunks])
        #      — one batched VoyageAI API call for all chunks.
        #   b) Inserts rows into langchain_pg_embedding with the vectors.
        #   c) Returns the list of IDs that were stored.
        # ------------------------------------------------------------------
        vector_store.add_documents(chunks, ids=chunk_ids)

        # ------------------------------------------------------------------
        # Step 5: Update the Document record
        # We still own the documents table — update status and chunk count.
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


# def delete_document_vectors(document_id: UUID) -> None:
#     """
#     Removes all vectors for a document from LangChain's embedding table.

#     Call this when a user deletes a document. Since LangChain owns the
#     vector table, there's no cascade delete from your documents table —
#     you have to clean up explicitly.

#     PGVector.delete() accepts a list of custom_ids (the UUIDs we stored
#     in chunk.metadata["chunk_id"] and passed as ids= to add_documents).
#     However, since we'd need to look those up, it's simpler to use the
#     filter-based deletion that queries cmetadata directly.
#     """
#     # PGVector exposes delete() by ids. To delete by metadata filter,
#     # we query the store first to get the ids, then delete.
#     # This is a known ergonomic gap in langchain-postgres — you can also
#     # write a raw SQL DELETE against langchain_pg_embedding if you prefer.
#     results = vector_store.get(
#         where={"document_id": str(document_id)},  # queries cmetadata JSONB
#     )

    
#     if results and results.get("ids"):
#         vector_store.delete(ids=results["ids"])
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
