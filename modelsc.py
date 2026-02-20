from sqlalchemy import Column, Integer, ForeignKey, Text, TIMESTAMP, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.database import Base

class ChannelContentComment(Base):
    __tablename__ = "channel_content_comments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content_id = Column(Integer, ForeignKey("channel_contents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    comment_text = Column(Text, nullable=False)

    # 🔹 NEW (threads)
    parent_comment_id = Column(
        Integer, 
        ForeignKey("channel_content_comments.id"), 
        nullable=True
    )

    # 🔹 NEW (moderation / UI)
    is_pinned = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)

    created_at = Column(TIMESTAMP, server_default=func.now())

    # This link is crucial:
    user = relationship("User", backref="comments")