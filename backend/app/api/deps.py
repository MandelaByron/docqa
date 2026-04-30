# app/api/deps.py
"""
FastAPI shared dependencies.

Organised into three sections:
  1. Database session factories
  2. Authentication
  3. Current-user resolver
"""
from collections.abc import AsyncGenerator, Generator
from contextlib import contextmanager

from fastapi import Depends, HTTPException, Request, status, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import async_engine, engine
from app.models.user import User
from app.security.verify_token import verify_token
from app.security.types import VerifyTokenOptions

from svix.webhooks import Webhook, WebhookVerificationError
# ---------------------------------------------------------------------------
# 1. Database sessions
# ---------------------------------------------------------------------------

# Async session factory — bound to the asyncpg engine.
# expire_on_commit=False prevents SQLModel from expiring attributes after
# commit, which would trigger lazy loads on already-closed connections.
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """
    Sync session — injected into get_current_user (which is sync) and any
    other sync dependencies. Not used directly in async route handlers.
    """
    with Session(engine) as session:
        yield session


@contextmanager
def get_sync_db() -> Generator[Session, None, None]:
    """
    Sync session as a plain context manager — for background tasks and ARQ
    workers where FastAPI's Depends() is not available.

    Usage:
        with get_sync_db() as db:
            ingestion.ingest_document(doc_id, db)
    """
    with Session(engine) as session:
        yield session


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async session — injected into async route handlers via Depends().
    """
    async with AsyncSessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# 2. Authentication
# ---------------------------------------------------------------------------

security = HTTPBearer()

verify_options = VerifyTokenOptions(
    audience=None,
    issuer=settings.CLERK_ISSUER,
    authorized_parties=None,
    jwt_key=settings.CLERK_JWKS_PUBLIC_KEY,
    clock_skew_in_ms=5000,
)


# ---------------------------------------------------------------------------
# 3. Current-user resolver
# ---------------------------------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates the Bearer JWT via Clerk, then resolves it to a User row.
    Raises 401 if the token is invalid or the user doesn't exist in the DB.
    """
    token = credentials.credentials

    try:
        payload = verify_token(token, verify_options)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing sub",
        )

    user = db.exec(select(User).where(User.clerk_user_id == clerk_user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user

async def verify_clerk_webhook(
    request: Request,
    svix_id: str = Header(None),
    svix_timestamp: str = Header(None),
    svix_signature: str = Header(None),
) -> dict:
    """
    Verifies the Svix signature on incoming Clerk webhook requests.
    Raises 400 if headers are missing or signature is invalid.
    Returns the parsed payload if valid.
    """
    if not all([svix_id, svix_timestamp, svix_signature]):
        raise HTTPException(status_code=400, detail="Missing Svix headers")

    # Get the raw body — must be read before any JSON parsing
    raw_body = await request.body()

    headers = {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
    }

    try:
        wh = Webhook(settings.CLERK_WEBHOOK_SIGNING_SECRET)
        payload = wh.verify(raw_body, headers)
        return payload
    except WebhookVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")