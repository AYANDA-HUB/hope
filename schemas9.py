from pydantic import BaseModel
from typing import Optional

class SubjectCreate(BaseModel):
    name: str
    code: str
    enrollment_key: str
    # Note: school_id is NOT here because we get it from the token for security
    model_config = {"from_attributes": True}

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    instructor_id: int
    school_id: int 
    model_config = {"from_attributes": True}

class EnrollKey(BaseModel):
    enrollment_key: str
    model_config = {"from_attributes": True}

class QuizCreate(BaseModel):
    title: str
    description: str
    model_config = {"from_attributes": True}

class ResultCreate(BaseModel):
    student_id: int
    quiz_id: Optional[int] = None
    marks: int
    result_type: str = "quiz"
    model_config = {"from_attributes": True}

class QuizGenerateRequest(BaseModel):
    title: str
    topic: str
    number_of_questions: int = 5
    model_config = {"from_attributes": True}

# --- NEW SCHEMA FOR MANUAL MARK ENTRY ---
class ManualMarkRequest(BaseModel):
    student_id: int
    subject_id: int
    test_title: str
    marks: float  # Using float to allow for decimal marks if needed
    model_config = {"from_attributes": True}