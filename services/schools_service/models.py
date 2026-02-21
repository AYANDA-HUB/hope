from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, CHAR, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from services.database import Base

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)

    district = Column(String(100), nullable=True)
    province = Column(String(100), nullable=True)

    # Admin who created this school
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    total_students = Column(Integer, default=0)
    total_instructors = Column(Integer, default=0)
    total_users = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to students & instructors
    users = relationship(
        "User",
        back_populates="school",
        foreign_keys="User.school_id",  # <- explicitly specify
        cascade="all, delete-orphan"
    )

    # Optional relationship to the admin who created the school
    creator = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_schools"
        )
