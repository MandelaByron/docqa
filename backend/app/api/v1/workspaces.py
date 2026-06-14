

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlmodel import Session
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_async_db, get_current_user, get_db
from app.models import Chat, Document, User, Workspace
from app.schemas.documents import DocumentRead, ChatWorkspaceUpdate
from app.schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate
from app.schemas.chat import ChatCreate, ChatRead

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_owned_workspace(
    workspace_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Workspace:
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")
    if workspace.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    
    return workspace


def _title_from_workspace(name: str) -> str:
    return f"{name} — workspace chat"


# ─── Workspace CRUD ───────────────────────────────────────────────────────────

@router.post("", response_model=WorkspaceRead, status_code=201)
async def create_workspace(
    payload: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    workspace = Workspace(
        owner_id=current_user.id,
        name=payload.name,
        is_personal=payload.is_personal,
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.get("", response_model=list[WorkspaceRead])
def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.exec(
        select(Workspace)
        .where(Workspace.owner_id == current_user.id)
        .order_by(Workspace.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{workspace_id}", response_model=WorkspaceRead)
def get_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.get(Workspace, workspace_id)


@router.patch("/{workspace_id}", response_model=WorkspaceRead)
async def update_workspace(
    workspace_id: UUID,
    payload: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    workspace = await _get_owned_workspace(workspace_id, current_user.id, db)
    if payload.name is not None:
        workspace.name = payload.name
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    workspace = await _get_owned_workspace(workspace_id, current_user.id, db)
    await db.delete(workspace)
    await db.commit()



@router.post("/{workspace_id}/chats")
def add_chat(
    workspace_id: UUID,
    payload: ChatWorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wkspace = db.get(Workspace, workspace_id)
    print(wkspace)
    chat = db.get(Chat, payload.chat_id)
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Verify the chat belongs to this user before reassigning
    if chat.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to move this chat")

    wkspace.chats.append(chat)
    db.add(wkspace)
    db.commit()
    #db.refresh(wkspace)

    return wkspace

