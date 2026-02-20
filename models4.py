from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from services.database import Base
from services.auth_service.models import User

class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)        # <- specify length
    description = Column(String(500))                  # <- specify length
    level = Column(String(100))                        # <- specify length
    venue = Column(String(255))                        # <- specify length
    start_datetime = Column(DateTime)
    district = Column(String(100))                     # <- specify length
    province = Column(String(100))                     # <- specify length
    created_by = Column(Integer, ForeignKey("users.id"))

    creator = relationship(User, back_populates="competitions")
