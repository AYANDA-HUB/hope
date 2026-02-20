from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class CompetitionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    level: str
    venue: str
    start_datetime: datetime  # Pydantic will parse ISO datetime
    district: Optional[str] = None
    province: Optional[str] = None

class CompetitionOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    level: str
    venue: str
    start_datetime: datetime
    district: Optional[str] = None
    province: Optional[str] = None
    created_by: int

    class Config:
        from_attributes = True  # Pydantic v2 ORM mode
