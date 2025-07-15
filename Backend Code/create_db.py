# create_db.py
import sys
import os

# Add the project root to the sys.path to allow imports like 'database' and 'models'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from database import Base, engine
# --- THE FIX: Add 'Company' to the import list ---
from models import User, Task, Group, Company, PasswordResetToken

print("Attempting to create/update database tables...")
try:
    # This will now create the 'companies' table and add the 'company_id' column to 'tasks'
    Base.metadata.create_all(bind=engine)
    print("Tables created/updated successfully.")
except Exception as e:
    print(f"An error occurred during table creation: {e}")
    print("Please ensure your PostgreSQL server is running and database credentials are correct.")

