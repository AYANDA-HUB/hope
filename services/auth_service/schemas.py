from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional
import re

# ---------------- REGISTER ----------------
class RegisterUser(BaseModel):
    username: str = Field(..., min_length=3) # Added username for registration
    password: str = Field(..., min_length=6)
    fullname: str
    role: str
    phone_number: str
    # FIX: Changed from school_id: int to school_username: str
    school_username: Optional[str] = None 

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v) or not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one uppercase and one lowercase letter")
        return v

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v):
        if not re.fullmatch(r"0\d{9}", v):
            raise ValueError("Phone number must be a valid 10-digit South African number")
        return v

# ---------------- LOGIN ----------------
class LoginUser(BaseModel):
    username: str
    password: str

# ---------------- JWT TOKEN ----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ---------------- PROFILE ----------------
class UserProfile(BaseModel):
    id: int
    username: str
    fullname: str
    role: str
    phone_number: str
    # FIX: Changed to match string-based lookup
    school_username: Optional[str] = None 
    profile_picture: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)

# ---------------- UPDATE PROFILE ----------------
class UpdateProfile(BaseModel):
    fullname: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None
    # FIX: Allow updating the school username
    school_username: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v):
        if v and not re.fullmatch(r"0\d{9}", v):
            raise ValueError("Phone number must be a valid 10-digit South African number")

        return v
