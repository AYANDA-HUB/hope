from pydantic import BaseModel

class ContentViewResponse(BaseModel):
    content_id: int
    total_views: int

    class Config:
        from_attributes = True
