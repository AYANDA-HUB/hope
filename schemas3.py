from pydantic import BaseModel
from datetime import datetime

class ChatbotRequest(BaseModel):
    user_id: int
    text: str
    language: str | None = None

class ChatbotResponse(BaseModel):
    id: int
    user_id: int
    text: str
    response: str
    language: str
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic V2 replacement for orm_mode
