from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CommentCreate(BaseModel):
    comment: str
    parent_comment_id: Optional[int] = None  # 🔹 reply support

class CommentUpdate(BaseModel):
    comment: str

class CommentResponse(BaseModel):
    id: int
    content_id: int
    user_id: int
    comment_text: str
    fullname: Optional[str] = None # 🔹 Added for UI
    username: Optional[str] = None # 🔹 Added for UI
    parent_comment_id: Optional[int]
    is_pinned: bool
    is_edited: bool
    created_at: datetime

    class Config:
        from_attributes = True