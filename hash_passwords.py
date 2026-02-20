import mysql.connector
from passlib.context import CryptContext

# Passlib setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password = password[:72]  # truncate for bcrypt
    return pwd_context.hash(password)

# Connect using the new user
conn = mysql.connector.connect(
    host="localhost",
    user="edusa_user",
    password="YourNewSecurePassword",  # <-- replace with your password
    database="edusa_db"
)

cursor = conn.cursor()

# Fetch all users
cursor.execute("SELECT id, password FROM users")
users = cursor.fetchall()

for user_id, plain_pass in users:
    if not plain_pass:  # skip empty passwords
        continue

    # Skip if already hashed
    if plain_pass.startswith("$2b$"):
        continue

    hashed = hash_password(plain_pass)
    cursor.execute("UPDATE users SET password=%s WHERE id=%s", (hashed, user_id))
    print(f"Updated user {user_id}")

conn.commit()
cursor.close()
conn.close()
print("All passwords hashed successfully.")
