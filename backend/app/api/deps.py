# Shared dependencies (get_current_user etc.)

from fastapi import Depends, HTTPException, status
from collections.abc import Generator
from sqlmodel import Session, select
from app.models.user import User
from app.database import engine
from svix.webhooks import Webhook, WebhookVerificationError
from fastapi import Header, HTTPException, Request
from app.config import settings
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.security.verify_token import verify_token
from app.security.types import VerifyTokenOptions



verify_options = VerifyTokenOptions(
    audience=None,  # or set if you use it
    issuer=settings.CLERK_ISSUER,
    authorized_parties=None,
    jwt_key=settings.CLERK_JWKS_PUBLIC_KEY,
    clock_skew_in_ms=5000,
)

security = HTTPBearer()

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = verify_token(token, verify_options)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    clerk_user_id = payload.get("sub")

    if not clerk_user_id:
        raise HTTPException(401, "Invalid token payload")

    user = db.exec(select(User).where(User.clerk_user_id == clerk_user_id)).first()

    return user



# app/api/deps.py

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