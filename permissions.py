from fastapi import Depends, HTTPException, status
from services.auth_service.dependencies import get_current_user


def instructor_only(user=Depends(get_current_user)):
    if user.role != "instructor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors can perform this action"
        )
    return user
