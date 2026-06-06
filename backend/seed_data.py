import numpy as np
from datetime import datetime, date, time, timedelta
import random

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance
from app.services.auth_service import get_password_hash

def seed():
    # Make sure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        print("Checking if database seeding is required...")
        
        # 1. Seed Admin User
        admin = db.query(User).filter(User.email == "admin@attendance.com").first()
        if not admin:
            print("Creating default admin account (admin@attendance.com)...")
            admin_user = User(
                email="admin@attendance.com",
                full_name="System Admin",
                hashed_password=get_password_hash("adminpassword"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Admin account created successfully!")
        else:
            print("Admin account already exists.")

        # 2. Seed Students
        student_count = db.query(Student).count()
        if student_count == 0:
            print("Creating mock students with simulated face encodings...")
            
            mock_students_data = [
                {"student_id": "CS2026001", "name": "Aarav Mehta", "department": "Computer Science", "semester": "6th"},
                {"student_id": "CS2026002", "name": "Diya Sharma", "department": "Computer Science", "semester": "6th"},
                {"student_id": "CS2026003", "name": "Kabir Malhotra", "department": "Computer Science", "semester": "6th"},
                {"student_id": "CS2026004", "name": "Ananya Sen", "department": "Computer Science", "semester": "6th"},
                {"student_id": "EC2026011", "name": "Rohan Verma", "department": "Electronics", "semester": "4th"},
                {"student_id": "EC2026012", "name": "Ishita Roy", "department": "Electronics", "semester": "4th"},
                {"student_id": "ME2026021", "name": "Arjun Nair", "department": "Mechanical Engineering", "semester": "8th"},
                {"student_id": "ME2026022", "name": "Sanya Gupta", "department": "Mechanical Engineering", "semester": "8th"}
            ]

            students = []
            for i, data in enumerate(mock_students_data):
                # Generate a random 128-d mock face encoding
                np.random.seed(i)
                mock_encoding = np.random.uniform(-0.1, 0.1, 128).astype(np.float64)
                
                student = Student(
                    student_id=data["student_id"],
                    name=data["name"],
                    department=data["department"],
                    semester=data["semester"],
                    image_path=f"/student_images/{data['student_id']}.jpg",
                    face_encoding=mock_encoding.tobytes(),
                    is_active=True
                )
                db.add(student)
                students.append(student)
                
            db.commit()
            print(f"{len(mock_students_data)} students created successfully!")
            
            # 3. Seed Attendance History for the past 7 days
            print("Generating 7 days of attendance history...")
            today_val = date.today()
            
            for day_offset in range(7, 0, -1):
                log_date = today_val - timedelta(days=day_offset)
                
                # Skip Sundays
                if log_date.weekday() == 6:
                    continue
                    
                for student in db.query(Student).all():
                    # Roll a dice for status: 80% Present, 10% Late, 10% Absent
                    roll = random.random()
                    if roll < 0.80:
                        status = "present"
                        # Random time between 8:30 and 8:59
                        hr = 8
                        minute = random.randint(30, 59)
                        sec = random.randint(0, 59)
                    elif roll < 0.90:
                        status = "late"
                        # Random time between 9:01 and 9:30
                        hr = 9
                        minute = random.randint(1, 30)
                        sec = random.randint(0, 59)
                    else:
                        # Absent: do not log attendance record
                        continue

                    # Log attendance record
                    attendance = Attendance(
                        student_id=student.id,
                        date=log_date,
                        time_in=time(hr, minute, sec),
                        status=status,
                        confidence=random.uniform(0.85, 0.98)
                    )
                    db.add(attendance)
                    
            db.commit()
            print("Attendance logs populated successfully!")
        else:
            print("Students already exist. Skipping student and attendance seeding.")

        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
