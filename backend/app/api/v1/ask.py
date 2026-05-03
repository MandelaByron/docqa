
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession
import json
import uuid

from app.models import User, Document
from app.schemas.documents import AskRequest
from app.api.deps import get_current_user, get_async_db
from app.services import rag
from app.utils.prompt import Request, convert_to_anthropic_messages
from app.utils.stream import patch_response_with_headers, stream_text
from app.config import settings
import anthropic

router = APIRouter(prefix="/ai", tags=["ai"])

# ── Ask (RAG) ─────────────────────────────────────────────────────────────────


claude = anthropic.Anthropic(api_key=settings.anthropic_api_key)

@router.post("/ask")
async def ask_question(
    request: Request,
    protocol: str = Query('data'),              # ← new param (AI SDK sends this)

):
    messages = request.messages

    ai_messages = convert_to_anthropic_messages(messages)

    response = StreamingResponse(stream_text(client= claude, messages=ai_messages, protocol=protocol), media_type="text/event-stream")
    return patch_response_with_headers(response, protocol)  # ← adds required headers

