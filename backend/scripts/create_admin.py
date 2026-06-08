import sys
from pathlib import Path

# Ensure project root is on PYTHONPATH
root = Path(__file__).resolve().parents[2]
sys.path.append(str(root))

from backend.app.database import get_db, engine, Base
from backend.app.models.user import User
from backend.app.services.auth_service import get_password_hash
from sqlalchemy.orm import Session


def create_admin():
    email = "admin@attendance.com"
    password = "admin123"
    role = "admin"

    # Create tables if they don't exist (useful for fresh DB)
    Base.metadata.create_all(bind=engine)

    db: Session = next(get_db())
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print("Admin user already exists.")
        return

    hashed = get_password_hash(password)
    admin_user = User(
        email=email,
        full_name="Admin User",
        hashed_password=hashed,
        role=role,
        department=None,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    print("Admin user created successfully.")

if __name__ == "__main__":
    create_admin()
