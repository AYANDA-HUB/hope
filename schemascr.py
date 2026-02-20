from pydantic import BaseModel

class CommentReactionCreate(BaseModel):
    emoji: str

class CommentReactionResponse(BaseModel):
    comment_id: int
    emoji: str
    total_reactions: int
