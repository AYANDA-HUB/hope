from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services.database import get_db
from services.auth_service.dependencies import get_current_user
from .models import StudentParent
from .service import send_sms_to_parents

router = APIRouter(prefix="/sms", tags=["SMS"])

@router.post("/send")
def send_sms(student_ids: list[int], message: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Only instructors can send SMS
    if current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can send SMS")
    
    parents = db.query(StudentParent).filter(StudentParent.student_id.in_(student_ids)).all()
    if not parents:
        raise HTTPException(status_code=404, detail="No parents found for these students")
    
    phone_numbers = [p.parent_phone for p in parents]
    send_sms_to_parents(message, phone_numbers)
    
    return {"message": "SMS sent", "recipients": len(phone_numbers)}
