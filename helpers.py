from sqlalchemy.orm import Session
from services.auth_service.models import User


def generate_admin_username(db: Session) -> str:
    """
    Generates admin usernames like:
    admin1, admin2, admin3, ...
    """
    admin_count = db.query(User).filter(User.role == "admin").count()
    return f"admin{admin_count + 1}"
