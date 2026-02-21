from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from services.database import Base

class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    language = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
