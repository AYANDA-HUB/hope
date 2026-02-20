# services/schools_service/routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from services.auth_service.dependencies import admin_only, get_db
from services.auth_service.models import User

router = APIRouter(
    prefix="/schools",
    tags=["Schools"]
)

@router.post("/", response_model=schemas.SchoolOut)
def create_school(
    school: schemas.SchoolCreate, 
    db: Session = Depends(get_db), 
    user: dict = Depends(admin_only)  # <- type is dict now
):
    # check if school exists
    existing_school = db.query(models.School).filter(models.School.name == school.name).first()
    if existing_school:
        raise HTTPException(status_code=400, detail="School already exists")

    new_school = models.School(
        name=school.name,
        district=school.district,
        province=school.province,
        created_by=user.id  # <- use dict access
    )

    db.add(new_school)
    try:
        db.commit()
        db.refresh(new_school)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return new_school


# ---------------- Delete a school (admin only) ----------------
@router.delete("/{school_id}")
def delete_school(
    school_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(admin_only)
):
    school = db.query(models.School).filter(models.School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    
    db.delete(school)
    db.commit()
    return {"detail": "School deleted successfully"}

# ---------------- Get all schools (admin only) ----------------
@router.get("/", response_model=list[schemas.SchoolOut])
def get_all_schools(
    db: Session = Depends(get_db),
    user: dict = Depends(admin_only)
):
    schools = db.query(models.School).all()
    return schools

# ---------------- Get stats of schools & users (admin only) ----------------
@router.get("/stats", response_model=schemas.SchoolStats)
def get_school_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(admin_only)
):
    total_schools = db.query(models.School).count()
    total_users = db.query(User).count()
    total_instructors = db.query(User).filter(User.role == "instructor").count()
    total_students = db.query(User).filter(User.role == "student").count()

    return schemas.SchoolStats(
        total_schools=total_schools,
        total_users=total_users,
        total_instructors=total_instructors,
        total_students=total_students
    )
