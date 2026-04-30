from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.api.deps import get_db
from app.models.user import User, Workspace
from app.api.deps import verify_clerk_webhook
from fastapi.responses import JSONResponse
from app.api.deps import get_current_user
from app.schemas.user import UserRead
router = APIRouter(tags=["auth"])

@router.post("/webhooks/clerk")
def clerk_webhook(payload: dict = Depends(verify_clerk_webhook), db: Session = Depends(get_db)):
    #payload = await request.json()
    event_type = payload["type"]

    if payload["type"] == "user.created":
        data = payload["data"]
        print(data)
        
        statement = select(User).where(User.clerk_user_id == data['id'])
        existing_user = db.exec(statement).first()

        if existing_user:
            return {"message": "User already exists"}
        
        full_name =f'{data["first_name"]} {data["last_name"]}' 
        user = User(
            clerk_user_id=data["id"],
            full_name=full_name,
            email=data["email_addresses"][0]["email_address"]
        )
        db.add(user)
        # Create default workspace
        workspace = Workspace(owner_id=user.id, name=f"{user.full_name}'s workspace")
        db.add(workspace)
        db.commit()

        return JSONResponse(status_code=200, content={"message": "User created successfully"})

        
@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the currently authenticated user's profile.
    Use this to verify auth is wired up correctly.
    """
    return current_user

