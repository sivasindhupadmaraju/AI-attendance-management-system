from pydantic import BaseModel
from datetime import date as DateType, time as TimeType, datetime
from typing import Optional
from .student import StudentResponse

class AttendanceBase(BaseModel):
    student_id: int
    status: str  # "present", "late", "absent"
    period: str = "Period 1"
    confidence: Optional[float] = None

class AttendanceCreate(AttendanceBase):
    date: DateType
    time_in: TimeType

class AttendanceResponse(AttendanceBase):
    id: int
    date: DateType
    time_in: TimeType
    created_at: datetime
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True

class FaceRecognizeRequest(BaseModel):
    image: str  # Base64 encoded JPEG image from webcam
    period: Optional[str] = None  # Specific period to mark, or None for Auto-detect

class FaceRecognizeResponse(BaseModel):
    success: bool
    message: str
    student_id: Optional[str] = None
    name: Optional[str] = None
    confidence: Optional[float] = None
    status: Optional[str] = None  # "present", "late", or None if failure
    period: Optional[str] = None

