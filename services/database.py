from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Use the MariaDB connector instead of PyMySQL
DATABASE_URL = "mariadb+mariadbconnector://root:YourNewSecurePassword@127.0.0.1:3306/edusa_db"

engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
