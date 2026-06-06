from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    time_in = Column(Time, nullable=False)
    status = Column(String, nullable=False)  # "present", "late", "absent"
    confidence = Column(Float, nullable=True)  # Recognition confidence metric (e.g., 1.0 - face_distance)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")

    # Composite uniqueness constraint - a student can only be marked once per day
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='uq_student_date'),
    )
