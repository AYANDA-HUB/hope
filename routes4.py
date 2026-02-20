from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from services.database import get_db
from .models import Competition
from services.auth_service.models import User
from services.auth_service.dependencies import get_current_user
from .schemas import CompetitionCreate, CompetitionOut

router = APIRouter(
    prefix="/competitions",
    tags=["Competitions"]
)

# ---------------- CREATE COMPETITION (admin only) ----------------
@router.post("/", response_model=CompetitionOut)
def create_competition(
    competition: CompetitionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)  # Removed :dict hint to avoid confusion
):
    # FIX: Use dot notation .role instead of ["role"]
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create competitions."
        )

    new_competition = Competition(
        title=competition.title,
        description=competition.description,
        level=competition.level,
        venue=competition.venue,
        start_datetime=competition.start_datetime,
        district=competition.district,
        province=competition.province,
        # FIX: Use dot notation .id instead of ["id"]
        created_by=current_user.id 
    )

    db.add(new_competition)
    db.commit()
    db.refresh(new_competition)
    return new_competition
# ---------------- GET ALL COMPETITIONS (students, instructors, admins) ----------------
@router.get("/", response_model=List[CompetitionOut])
def list_competitions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    competitions = db.query(Competition).all()
    return competitions
