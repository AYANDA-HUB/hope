from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.database import Base


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(String(500))
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    instructor = relationship("User")
    contents = relationship(
        "ChannelContent",
        back_populates="channel",
        cascade="all, delete-orphan"
    )


class ChannelContent(Base):
    __tablename__ = "channel_contents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False)

    content_type = Column(Enum("text", "image", "video", "file", "live"), nullable=False)

    title = Column(String(200))
    text_content = Column(String(2000))  # renamed from 'body'
    file_url = Column(String(500))
    live_url = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())


    channel = relationship("Channel", back_populates="contents")
