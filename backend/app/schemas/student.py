from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StudentBase(BaseModel):
    student_id: str
    name: str
    department: str
    semester: str
    is_active: Optional[bool] = True

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(StudentBase):
    id: int
    image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
