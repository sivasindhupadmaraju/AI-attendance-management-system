import numpy as np
from datetime import datetime, date, time, timedelta
import random

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance
from app.services.auth_service import get_password_hash

def seed():
    # Make sure tables are recreated
    print("Dropping and recreating database tables to apply schema changes...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        print("Seeding database...")
        
        # 1. Seed Admin User
        print("Creating default admin account (admin@attendance.com)...")
        admin_user = User(
            email="admin@attendance.com",
            full_name="System Admin",
            hashed_password=get_password_hash("adminpassword"),
            role="admin"
        )
        db.add(admin_user)
        
        # 2. Seed Teacher User
        print("Creating default teacher account (teacher@attendance.com)...")
        teacher_user = User(
            email="teacher@attendance.com",
            full_name="CS Dept Teacher",
            hashed_password=get_password_hash("teacherpassword"),
            role="teacher",
            department="Computer Science"
        )
        db.add(teacher_user)
        db.commit()
        print("User accounts seeded successfully!")

        # 3. Seed Students
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
        
        # 4. Seed Attendance History for the past 7 days (multiple periods/hours per day)
        print("Generating 7 days of attendance history...")
        today_val = date.today()
        
        for day_offset in range(7, 0, -1):
            log_date = today_val - timedelta(days=day_offset)
            
            # Skip Sundays
            if log_date.weekday() == 6:
                continue
                
            for student in db.query(Student).all():
                # Seed attendance for 3 different periods/hours of the day
                for period_num in [1, 2, 5]:
                    period_name = f"Period {period_num} ({(period_num + 8) % 12 or 12}-{(period_num + 9) % 12 or 12} {'AM' if period_num < 4 else 'PM'})"
                    # For Period 5, let's fix slot naming: Period 5 (2-3 PM)
                    if period_num == 5:
                        period_name = "Period 5 (2-3 PM)"
                    elif period_num == 1:
                        period_name = "Period 1 (9-10 AM)"
                    elif period_num == 2:
                        period_name = "Period 2 (10-11 AM)"

                    # Roll a dice for status: 80% Present, 10% Late, 10% Absent
                    roll = random.random()
                    if roll < 0.80:
                        status = "present"
                        # Start of period hour
                        hr = 9 if period_num == 1 else (10 if period_num == 2 else 14)
                        minute = random.randint(0, 9)  # within 10 min late threshold
                        sec = random.randint(0, 59)
                    elif roll < 0.90:
                        status = "late"
                        hr = 9 if period_num == 1 else (10 if period_num == 2 else 14)
                        minute = random.randint(11, 45) # late
                        sec = random.randint(0, 59)
                    else:
                        # Absent
                        continue

                    # Log attendance record
                    attendance = Attendance(
                        student_id=student.id,
                        date=log_date,
                        time_in=time(hr, minute, sec),
                        status=status,
                        period=period_name,
                        confidence=random.uniform(0.85, 0.98)
                    )
                    db.add(attendance)
                    
        db.commit()
        print("Attendance logs populated successfully!")

        print("Database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()

