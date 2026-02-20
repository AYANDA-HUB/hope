from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from services.database import get_db
from services.auth_service.models import User
from services.auth_service.config import SECRET_KEY, ALGORITHM
from datetime import date
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

# FIX: Import your subscription models
from services.system_subscription_service import models as sub_models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Fetch the FULL user record from DB
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user  # This is a SQLAlchemy Model instance
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

def require_role(required_role: str):
    def role_checker(user: User = Depends(get_current_user)):
        if user.role != required_role:
            raise HTTPException(status_code=403, detail="Access forbidden")
        return user
    return role_checker

# ✅ Admin-only shortcut
admin_only = require_role("admin")


def global_subscription_guard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Blocks STUDENTS from the entire system if they don't have an active subscription.
    Admins and Instructors are allowed through automatically.
    """
    if user.role == "student":
        # Check if an active, completed subscription exists for today
        active_sub = db.query(sub_models.SystemSubscription).filter(
            sub_models.SystemSubscription.user_id == user.id,
            sub_models.SystemSubscription.payment_status == 'completed',
            sub_models.SystemSubscription.end_date >= date.today()
        ).first()
        
        if not active_sub:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="SYSTEM_LOCKED: Active subscription required."
            )
    
    return user