# reset_admin_password.py
from services.auth_service.security import hash_password

# Step 1: Choose new password
new_password = "Admin123"  # must meet validation rules

# Step 2: Hash it
hashed_password = hash_password(new_password)

# Step 3: Print the hash
print("Copy this hash to MariaDB:", hashed_password)
