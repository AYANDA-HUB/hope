from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import random, string, os

from services.database import get_db
from services.auth_service.models import User
from services.auth_service.schemas import RegisterUser, Token, LoginUser, UserProfile
from services.auth_service.security import hash_password, verify_password
from services.auth_service.jwt import create_access_token
from services.auth_service.dependencies import get_current_user, require_role

router = APIRouter(prefix="/auth", tags=["Auth"])

# ===========================
# USERNAME GENERATORS
# ===========================

def generate_unique_username(db: Session) -> str:
    while True:
        # Generates a username like U1234
        username = "U" + "".join(random.choices(string.digits, k=4))
        if not db.query(User).filter(User.username == username).first():
            return username

def generate_admin_username(db: Session) -> str:
    last_admin = (
        db.query(User.username)
        .filter(User.username.like("admin%"))
        .order_by(User.id.desc())
        .first()
    )
    last_number = int(last_admin.username.replace("admin", "")) if last_admin else 0
    next_number = last_number + 1
    if next_number > 100:
        raise HTTPException(status_code=400, detail="Max 100 admins reached")
    return f"admin{next_number}"

# ===========================
# REGISTER (STUDENT / INSTRUCTOR)
# ===========================

@router.post("/register")
def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot register here")

    # FIX: Check for school_username (String) instead of school_id
    if user.role in ["student", "instructor"] and not user.school_username:
        raise HTTPException(status_code=400, detail="school_username required")

    try:
        new_user = User(
            username=generate_unique_username(db),
            password=hash_password(user.password),
            fullname=user.fullname,
            role=user.role,
            phone_number=user.phone_number,
            school_id= new_user.school_id
        
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role,
            "school_username": new_user.school_username
        }
    except IntegrityError:
        db.rollback()
        # Changed to 400 because this usually means the phone number is already taken
        raise HTTPException(status_code=400, detail="Registration failed: Username or Phone already exists")

# ===========================
# LOGIN — FORM (Swagger / OAuth2)
# ===========================

@router.post("/login", response_model=Token)
def login_for_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

# ===========================
# LOGIN — JSON (Frontend / Fetch)
# ===========================

@router.post("/login-json", response_model=Token)
def login_json(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": str(db_user.id), "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

# ===========================
# CURRENT USER
# ===========================

@router.get("/me", response_model=UserProfile)
def read_current_user(user: User = Depends(get_current_user)):
    # This now returns the User object which Pydantic converts to UserProfile
    # Since UserProfile now expects a string for school_username, this won't crash.
    return user

# ===========================
# DASHBOARDS
# ===========================

@router.get("/student/dashboard")
def student_dashboard(user: User = Depends(require_role("student"))):
    return {"message": "Student dashboard", "user": user}

@router.get("/instructor/dashboard")
def instructor_dashboard(user: User = Depends(require_role("instructor"))):
    return {"message": "Instructor dashboard", "user": user}

@router.get("/admin/dashboard")
def admin_dashboard(user: User = Depends(require_role("admin")), db: Session = Depends(get_db)):
    admins = db.query(User).filter(User.role == "admin").all()
    return {
        "message": "Admin dashboard",
        "admins": [
            {
                "id": a.id,
                "username": a.username,
                "fullname": a.fullname
            } for a in admins
        ]
    }

# ===========================
# CREATE ADMIN (ADMIN ONLY)
# ===========================

@router.post("/admin/create-admin")
def create_admin(user: RegisterUser, db: Session = Depends(get_db), _: User = Depends(require_role("admin"))):
    new_admin = User(
        username=generate_admin_username(db),
        password=hash_password(user.password),
        fullname=user.fullname,
        role="admin",
        phone_number=user.phone_number,
        school_username=None # Admins aren't tied to a specific school
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return {"id": new_admin.id, "username": new_admin.username}

# ===========================
# PROFILE PICTURE
# ===========================

@router.put("/users/profile-picture")
def update_profile_picture(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    upload_dir = "uploads/profile_pics"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Secure the filename using the user ID
    file_extension = os.path.splitext(file.filename)[1]
    file_path = f"{upload_dir}/{user.id}{file_extension}"

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    user.profile_picture = file_path
    db.commit()
    return {"message": "Profile picture updated", "path": file_path}
