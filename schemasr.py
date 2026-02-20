from pydantic import BaseModel

class ReactionCreate(BaseModel):
    emoji: str

class ReactionResponse(BaseModel):
    content_id: int
    emoji: str
    total_reactions: int

    class Config:
        from_attributes = True  # Pydantic V2 replacement for orm_mode
 