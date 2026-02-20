from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Text, TIMESTAMP, func
from sqlalchemy.orm import relationship
from services.database import Base

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    code = Column(String(50))
    instructor_id = Column(Integer, ForeignKey("users.id"))
    # FIX: Added school_id to isolate subjects by school
    school_id = Column(Integer, index=True, nullable=False) 
    enrollment_key = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    materials = relationship("SubjectMaterial", back_populates="subject")
    enrollments = relationship("SubjectEnrollment", back_populates="subject")

class SubjectEnrollment(Base):
    __tablename__ = "subject_enrollments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    enrolled_at = Column(DateTime, server_default=func.now())
    
    subject = relationship("Subject", back_populates="enrollments")

class SubjectMaterial(Base):
    __tablename__ = "subject_materials"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String(255))
    filename = Column(String(255))
    file_type = Column(String(50))
    uploaded_at = Column(DateTime, server_default=func.now())
    
    subject = relationship("Subject", back_populates="materials")

class SubjectQuiz(Base):
    __tablename__ = "subject_quizzes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String(255))
    description = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

class StudentResult(Base):
    __tablename__ = "student_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    quiz_id = Column(Integer, ForeignKey("subject_quizzes.id"), nullable=True)
    marks = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

class GeneratedQuiz(Base):
    __tablename__ = "generated_quizzes"
    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())

class GeneratedQuestion(Base):
    __tablename__ = "generated_questions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("generated_quizzes.id"))
    question = Column(Text, nullable=False)
    option_a = Column(String(255))
    option_b = Column(String(255))
    option_c = Column(String(255))
    option_d = Column(String(255))
    correct_answer = Column(String(1))

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("generated_quizzes.id", ondelete="CASCADE"))
    student_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    feedback = Column(String)
    answers_json = Column(String) 
    created_at = Column(TIMESTAMP, server_default=func.now())

class ManualTestResult(Base):
    __tablename__ = "manual_test_results"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id", name="fk_manual_student", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", name="fk_manual_subject", ondelete="CASCADE"), nullable=False)
    test_title = Column(String(255), nullable=False)
    marks = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User")
    subject = relationship("Subject")