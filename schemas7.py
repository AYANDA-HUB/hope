# services/schools_service/schemas.py

from pydantic import BaseModel
from datetime import datetime

class SchoolCreate(BaseModel):
    name: str
    district: str | None = None
    province: str | None = None

class SchoolOut(BaseModel):
    id: int
    name: str
    district: str | None
    province: str | None
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True

class SchoolStats(BaseModel):
    total_schools: int
    total_users: int
    total_instructors: int
    total_students: int
