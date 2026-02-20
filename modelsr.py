from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func
from services.database import Base

class ChannelContentReaction(Base):
    __tablename__ = "channel_content_reactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content_id = Column(Integer, ForeignKey("channel_contents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(10), nullable=False)  # e.g., "👍", "❤️", "😂"
    reacted_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("content_id", "user_id", "emoji", name="unique_user_content_reaction"),
    )
