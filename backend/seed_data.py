import numpy as np
from datetime import datetime, date, time, timedelta
import random

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance
from app.services.auth_service import get_password_hash
from app.config import settings

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
        
        # 2. Seed Teacher Users (multiple departments)
        teachers = [
            {"email": "teacher@attendance.com", "full_name": "Dr. Priya Sharma", "department": "Computer Science"},
            {"email": "ravi.kumar@attendance.com", "full_name": "Prof. Ravi Kumar", "department": "Electronics"},
            {"email": "meena.iyer@attendance.com", "full_name": "Dr. Meena Iyer", "department": "Mechanical Engineering"},
        ]
        for t in teachers:
            print(f"Creating teacher account ({t['email']})...")
            teacher_user = User(
                email=t["email"],
                full_name=t["full_name"],
                hashed_password=get_password_hash("teacherpassword"),
                role="teacher",
                department=t["department"]
            )
            db.add(teacher_user)
        
        db.commit()
        print("User accounts seeded successfully!")

        # 3. Seed Students (more students, across all departments)
        print("Creating mock students with simulated face encodings...")
        
        mock_students_data = [
            # Computer Science
            {"student_id": "CS2026001", "name": "Aarav Mehta", "department": "Computer Science", "semester": "6th"},
            {"student_id": "CS2026002", "name": "Diya Sharma", "department": "Computer Science", "semester": "6th"},
            {"student_id": "CS2026003", "name": "Kabir Malhotra", "department": "Computer Science", "semester": "6th"},
            {"student_id": "CS2026004", "name": "Ananya Sen", "department": "Computer Science", "semester": "6th"},
            {"student_id": "CS2026005", "name": "Vikram Patel", "department": "Computer Science", "semester": "4th"},
            {"student_id": "CS2026006", "name": "Neha Reddy", "department": "Computer Science", "semester": "4th"},
            # Electronics
            {"student_id": "EC2026011", "name": "Rohan Verma", "department": "Electronics", "semester": "4th"},
            {"student_id": "EC2026012", "name": "Ishita Roy", "department": "Electronics", "semester": "4th"},
            {"student_id": "EC2026013", "name": "Aditya Joshi", "department": "Electronics", "semester": "6th"},
            {"student_id": "EC2026014", "name": "Sneha Pillai", "department": "Electronics", "semester": "6th"},
            # Mechanical Engineering
            {"student_id": "ME2026021", "name": "Arjun Nair", "department": "Mechanical Engineering", "semester": "8th"},
            {"student_id": "ME2026022", "name": "Sanya Gupta", "department": "Mechanical Engineering", "semester": "8th"},
            {"student_id": "ME2026023", "name": "Manish Tiwari", "department": "Mechanical Engineering", "semester": "6th"},
            # Civil Engineering
            {"student_id": "CE2026031", "name": "Pooja Deshmukh", "department": "Civil Engineering", "semester": "4th"},
            {"student_id": "CE2026032", "name": "Rahul Saxena", "department": "Civil Engineering", "semester": "4th"},
            # Information Technology
            {"student_id": "IT2026041", "name": "Shreya Bhat", "department": "Information Technology", "semester": "6th"},
            {"student_id": "IT2026042", "name": "Karthik Menon", "department": "Information Technology", "semester": "6th"},
            {"student_id": "IT2026043", "name": "Lavanya Rao", "department": "Information Technology", "semester": "4th"},
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
        
        # 4. Seed Attendance History for the past 7 days using configured periods
        print("Generating 7 days of attendance history across all periods...")
        today_val = date.today()
        
        # Use the actual period config
        configured_periods = settings.PERIODS
        total_records = 0
        
        for day_offset in range(7, 0, -1):
            log_date = today_val - timedelta(days=day_offset)
            
            # Skip Sundays
            if log_date.weekday() == 6:
                continue
                
            for student in db.query(Student).all():
                # Each student attends a random subset of periods each day (3 to all)
                num_periods = random.randint(3, len(configured_periods))
                selected_periods = random.sample(configured_periods, num_periods)
                
                for period in selected_periods:
                    period_name = period["name"]
                    period_start = datetime.strptime(period["start"], "%H:%M:%S").time()
                    late_threshold = period["late_threshold_min"]
                    start_hr = period_start.hour
                    
                    # Roll a dice for status: 75% Present, 15% Late, 10% Absent
                    roll = random.random()
                    if roll < 0.75:
                        status = "present"
                        minute = random.randint(0, late_threshold - 1)
                        sec = random.randint(0, 59)
                    elif roll < 0.90:
                        status = "late"
                        minute = random.randint(late_threshold + 1, 45)
                        sec = random.randint(0, 59)
                    else:
                        # Absent — skip creating a record
                        continue

                    attendance = Attendance(
                        student_id=student.id,
                        date=log_date,
                        time_in=time(start_hr, minute, sec),
                        status=status,
                        period=period_name,
                        confidence=round(random.uniform(0.82, 0.99), 4)
                    )
                    db.add(attendance)
                    total_records += 1
                    
        db.commit()
        print(f"{total_records} attendance records populated successfully!")

        print("\n=== Database Seeding Complete ===")
        print(f"  Users:     {db.query(User).count()}")
        print(f"  Students:  {db.query(Student).count()}")
        print(f"  Records:   {db.query(Attendance).count()}")
        print("\nLogin Credentials:")
        print("  Admin:   admin@attendance.com / adminpassword")
        print("  Teacher: teacher@attendance.com / teacherpassword")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
