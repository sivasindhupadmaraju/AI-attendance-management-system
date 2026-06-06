from sqlalchemy import Column, Integer, String, Boolean, DateTime, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)  # Roll number
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    semester = Column(String, nullable=False)
    image_path = Column(String, nullable=True)
    face_encoding = Column(LargeBinary, nullable=True)  # Store 128-d face vector as bytes
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to attendance records
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
