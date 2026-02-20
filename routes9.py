from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from services.database import get_db
from services.auth_service.models import User
from services.auth_service.dependencies import get_current_user
from . import models, schemas
from .quiz_generator import generate_quiz
from services.sms_service.service import send_sms_to_parents
import json

router = APIRouter(prefix="/subjects", tags=["Subjects"])

# =====================================================
# SUBJECTS & ENROLLMENT (PRESERVED & FIXED)
# =====================================================

@router.get("/enrolled")
def get_enrolled_subjects(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(403, "Only students can view enrolled subjects")

    subjects = (
        db.query(models.Subject)
        .join(models.SubjectEnrollment,
              models.Subject.id == models.SubjectEnrollment.subject_id)
        .filter(models.SubjectEnrollment.student_id == current_user.id)
        # Added extra layer to ensure results are within their school
        .filter(models.Subject.school_id == current_user.school_id)
        .all()
    )

    return [
        {
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "instructor_id": s.instructor_id
        }
        for s in subjects
    ]

@router.get("/")
def get_all_subjects(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # FIXED: Strict school-level filter for all roles
    query = db.query(models.Subject).filter(models.Subject.school_id == current_user.school_id)
    subjects = query.all()

    if current_user.role == "student":
        return [{"id": s.id, "name": s.name, "code": s.code, "instructor_id": s.instructor_id} for s in subjects]
   
    # For instructors, filter to only show subjects they manage within their school
    instructor_subs = [s for s in subjects if s.instructor_id == current_user.id]
    return [{"id": s.id, "name": s.name, "code": s.code, "enrollment_key": s.enrollment_key} for s in instructor_subs]

@router.post("/create")
def create_subject(
    data: schemas.SubjectCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "instructor":
        raise HTTPException(403, "Only instructors can create subjects")

    # FIXED: Automatically bind the subject to the instructor's school_id
    subject = models.Subject(
        name=data.name,
        code=data.code,
        enrollment_key=data.enrollment_key,
        instructor_id=current_user.id,
        school_id=current_user.school_id
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {"message": "Subject created", "subject_id": subject.id}

@router.post("/{subject_id}/enroll")
def enroll_subject(
    subject_id: int,
    key: schemas.EnrollKey,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(403, "Only students can enroll")

    # Verify subject belongs to the SAME school
    subject = db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.school_id == current_user.school_id
    ).first()

    if not subject:
        raise HTTPException(404, "Subject not found in your school")

    if subject.enrollment_key != key.enrollment_key:
        raise HTTPException(400, "Invalid enrollment key")

    exists = db.query(models.SubjectEnrollment).filter_by(
        subject_id=subject_id,
        student_id=current_user.id
    ).first()

    if exists:
        raise HTTPException(400, "Already enrolled")

    db.add(models.SubjectEnrollment(subject_id=subject_id, student_id=current_user.id))
    db.commit()
    
    return {"message": "Enrolled successfully"}

# =====================================================
# MATERIALS (PRESERVED & FIXED)
# =====================================================

@router.post("/{subject_id}/materials/upload")
def upload_material(
    subject_id: int,
    file: UploadFile = File(...),
    title: str = "",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "instructor":
        raise HTTPException(403, "Only instructors")

    # FIXED: Verify the subject belongs to the instructor AND their school
    subject = db.query(models.Subject).filter_by(
        id=subject_id, 
        instructor_id=current_user.id,
        school_id=current_user.school_id
    ).first()
    
    if not subject:
        raise HTTPException(404, "Subject not found or access denied")

    path = f"uploads/{file.filename}"
    with open(path, "wb") as f:
        f.write(file.file.read())

    db.add(models.SubjectMaterial(
        subject_id=subject_id,
        title=title or file.filename,
        filename=path,
        file_type=file.content_type
    ))
    db.commit()
    return {"message": "Material uploaded"}

# =====================================================
# AI-ONLY QUIZZES (PRESERVED & FIXED)
# =====================================================

@router.post("/{subject_id}/quizzes/generate")
def ai_generate_quiz(
    subject_id: int, 
    data: schemas.QuizGenerateRequest, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "instructor":
        raise HTTPException(403, "Only instructors can generate quizzes")

    # FIXED: Security check to ensure the subject is in the instructor's school
    subject = db.query(models.Subject).filter_by(id=subject_id, school_id=current_user.school_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")

    new_quiz = models.GeneratedQuiz(
        subject_id=subject_id,
        title=data.title,
        topic=data.topic,
        created_by=current_user.id
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    generate_quiz(new_quiz.id, data.topic, db) 

    return {"message": "Quiz generated successfully", "quiz_id": new_quiz.id}

@router.get("/{subject_id}/quizzes")
def get_subject_quizzes(subject_id: int, db: Session = Depends(get_db)):
    return db.query(models.GeneratedQuiz).filter_by(subject_id=subject_id).all()

@router.get("/quizzes/{quiz_id}/questions")
def get_quiz_questions(quiz_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.GeneratedQuestion).filter_by(quiz_id=quiz_id).all()
    return [
        {
            "id": q.id,
            "text": q.question,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d]
        }
        for q in questions
    ]

@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, submission: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_answers = submission.get("answers", {})
    questions = db.query(models.GeneratedQuestion).filter_by(quiz_id=quiz_id).all()
    
    correct_count = 0
    for q in questions:
        user_choice_text = str(user_answers.get(f"q{q.id}", "")).strip()
        mapping = {
            "A": str(q.option_a).strip(),
            "B": str(q.option_b).strip(),
            "C": str(q.option_c).strip(),
            "D": str(q.option_d).strip()
        }
        correct_letter = str(q.correct_answer).strip().upper()
        if user_choice_text == mapping.get(correct_letter):
            correct_count += 1

    score = (correct_count / len(questions)) * 100 if questions else 0
    feedback = f"Final Score: {correct_count}/{len(questions)}"

    attempt = models.QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        score=round(score, 2),
        feedback=feedback,
        answers_json=json.dumps(user_answers)
    )
    db.add(attempt)
    db.commit()

    return {"score": round(score, 2), "feedback": feedback}

@router.get("/my-results")
def get_my_results(
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(403, "Only students can view their results")

    results = (
        db.query(models.QuizAttempt, models.GeneratedQuiz.title)
        .join(models.GeneratedQuiz, models.QuizAttempt.quiz_id == models.GeneratedQuiz.id)
        .filter(models.QuizAttempt.student_id == current_user.id)
        .order_by(models.QuizAttempt.id.desc())
        .all()
    )

    return [
        {
            "id": r.QuizAttempt.id,
            "quiz_title": r.title,
            "score": r.QuizAttempt.score,
            "feedback": r.QuizAttempt.feedback,
            "date": r.QuizAttempt.id 
        }
        for r in results
    ]

@router.get("/quizzes/{quiz_id}/analytics")
def get_quiz_analytics(
    quiz_id: int, 
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "instructor":
        raise HTTPException(403, "Only instructors can view analytics")

    # FIXED: Ensure instructor can only see analytics for a quiz belonging to their school
    quiz = db.query(models.GeneratedQuiz).join(models.Subject).filter(
        models.GeneratedQuiz.id == quiz_id,
        models.Subject.school_id == current_user.school_id
    ).first()
    
    if not quiz:
        raise HTTPException(404, "Quiz not found or unauthorized")

    results = (
        db.query(models.QuizAttempt, User.fullname)
        .join(User, models.QuizAttempt.student_id == User.id)
        .filter(models.QuizAttempt.quiz_id == quiz_id)
        .all()
    )

    return [
        {
            "student_name": r.fullname if r.fullname else "Unknown Student",
            "score": r.QuizAttempt.score,
            "feedback": r.QuizAttempt.feedback,
            "submitted_at": r.QuizAttempt.created_at.strftime("%Y-%m-%d %H:%M") 
                            if hasattr(r.QuizAttempt, 'created_at') and r.QuizAttempt.created_at 
                            else "N/A"
        }
        for r in results
    ]

# =====================================================
# MANUAL MARKING & STUDENT LIST (FIXED)
# =====================================================

@router.get("/{subject_id}/students")
def get_subject_students(
    subject_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    if current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Not authorized")

    # FIXED: Ensure instructor only pulls student lists for their own school
    subject = db.query(models.Subject).filter_by(id=subject_id, school_id=current_user.school_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")

    students = (
        db.query(User)
        .join(models.SubjectEnrollment, User.id == models.SubjectEnrollment.student_id)
        .filter(models.SubjectEnrollment.subject_id == subject_id)
        .all()
    )
    
    return [{"id": s.id, "fullname": s.fullname} for s in students]

@router.post("/manual-mark")
def record_manual_mark(
    data: schemas.ManualMarkRequest, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can record marks")

    # FIXED: Verify the subject and student belong to the same school as the instructor
    subject = db.query(models.Subject).filter_by(id=data.subject_id, school_id=current_user.school_id).first()
    student = db.query(User).filter_by(id=data.student_id, school_id=current_user.school_id).first()
    
    if not subject or not student:
        raise HTTPException(404, "Data mismatch: Subject or Student not found in your school")

    new_result = models.ManualTestResult(
        student_id=data.student_id,
        subject_id=data.subject_id,
        test_title=data.test_title,
        marks=data.marks
    )
    db.add(new_result)
    db.commit()
    db.refresh(new_result)

    if student.phone_number:
        message = f"Hello, the result for {student.fullname} in {data.test_title} is {data.marks}%."
        try:
            send_sms_to_parents(student.phone_number, message)
        except Exception as e:
            print(f"SMS Failed: {e}")

    return {"status": "success", "message": "Result recorded and SMS sent"}