from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.database import get_db
from services.quizzes_service.models import Quiz
from services.quizzes_service.schemas import QuizCreate

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.post("/")
def create_quiz(
    payload: QuizCreate,
    instructor_id: int,
    db: Session = Depends(get_db)
):
    quiz = Quiz(
        title=payload.title,
        instructor_id=instructor_id,
        school_id=payload.school_id
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    return quiz
