from pydantic import BaseModel

class SMSCreate(BaseModel):
    message: str
    student_ids: list[int]

    model_config = {"from_attributes": True}  # pydantic v2
