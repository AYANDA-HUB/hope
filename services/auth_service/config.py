
# services/auth_service/config.py
import os
from dotenv import load_dotenv

load_dotenv()  # Make sure this is called once at app startup

SESSION_SECRET = os.getenv(
    "SESSION_SECRET",
    "fallback-secret-for-local-testing"  # optional default
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
