from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func
from services.database import Base

class ChannelContentView(Base):
    __tablename__ = "channel_content_views"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content_id = Column(Integer, ForeignKey("channel_contents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    viewed_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("content_id", "user_id", name="unique_content_user_view"),
    )
