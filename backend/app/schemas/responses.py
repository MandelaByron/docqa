from pydantic import BaseModel

# Generic message
class MessageResponse(BaseModel):
    message: str