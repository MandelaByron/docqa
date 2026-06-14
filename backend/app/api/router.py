# Aggregates all sub-routers
from fastapi import APIRouter
from app.api.v1 import auth, documents, ask, chat, workspaces

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(ask.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
api_router.include_router(workspaces.router)