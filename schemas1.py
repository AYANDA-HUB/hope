from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime


# ============================
# CHANNEL SCHEMAS
# ============================
class ChannelCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ChannelOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    instructor_id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ============================
# CHANNEL CONTENT SCHEMAS
# ============================
class ContentCreate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None           # for text posts
    live_url: Optional[HttpUrl] = None   # for live links

    class Config:
        orm_mode = True


class ContentOut(BaseModel):
    id: int
    channel_id: int
    content_type: str
    title: Optional[str] = None
    text_content: Optional[str] = None
    file_url: Optional[str] = None
    live_url: Optional[HttpUrl] = None
    created_at: datetime

    class Config:
        orm_mode = True
