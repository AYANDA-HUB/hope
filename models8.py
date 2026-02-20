from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func
from services.database import Base

class StudentParent(Base):
    __tablename__ = "student_parents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    parent_name = Column(String(100), nullable=False)
    parent_phone = Column(String(20), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
