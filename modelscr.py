from sqlalchemy import Column, Integer, ForeignKey, String, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func
from services.database import Base

class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("channel_content_comments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    emoji = Column(String(10), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
