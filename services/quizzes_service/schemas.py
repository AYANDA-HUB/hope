from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class QuizCreate(BaseModel):
    title: str
    school_id: Optional[int] = None

class QuizResponse(BaseModel):
    id: int
    title: str
    instructor_id: int
    school_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

