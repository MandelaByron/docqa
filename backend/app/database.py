# app/database.py
"""
Database engines.

Two engines exist side by side:
  - engine       → sync, used by background tasks and LangChain (add_documents is sync)
  - async_engine → async, used by FastAPI route handlers and LangChain retrieval (ainvoke)

URL derivation:
  settings.database_url is assumed to be a plain postgresql:// URL.
  We derive the async variant by swapping the driver to asyncpg.
"""
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import create_engine

from app.config import settings

# Plain postgresql:// — works with psycopg2 (sync)
SYNC_URL = settings.database_url

# postgresql+asyncpg:// — required for SQLAlchemy async and LangChain async ops
ASYNC_URL = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_engine(SYNC_URL, echo=False)

async_engine = create_async_engine(ASYNC_URL, echo=False)