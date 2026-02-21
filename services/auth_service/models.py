from sqlalchemy import Column, Integer, String, Enum, CHAR, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from services.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(20), unique=True, nullable=False)
    fullname = Column(String(100))
    password = Column(String(255), nullable=False)
    profile_picture = Column(String(255), nullable=True)  # New column


    role = Column(
        Enum("student", "instructor", "admin"),
        nullable=False
    )

    phone_number = Column(CHAR(10), unique=True, nullable=False)

    # ONLY students & instructors use this
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    # Relationship to their school
    school = relationship(
        "School",
        back_populates="users",
        foreign_keys=[school_id]  # <- explicitly specify
    )

    # Relationship to schools this user created (if admin)
    created_schools = relationship(
        "School",
        back_populates="creator",
        foreign_keys="School.created_by",
        cascade="all, delete-orphan"
    )

    competitions = relationship(
        "Competition",
        back_populates="creator",
        cascade="all, delete-orphan"
    )

    channels = relationship("Channel", back_populates="instructor")
