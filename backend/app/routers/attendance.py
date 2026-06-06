from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, time
from typing import List, Optional

from ..database import get_db
from ..models.student import Student
from ..models.attendance import Attendance
from ..schemas.attendance import AttendanceResponse, FaceRecognizeRequest, FaceRecognizeResponse
from ..services.face_service import FaceService
from ..utils.dependencies import get_current_user
from ..config import settings

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/recognize", response_model=FaceRecognizeResponse)
def recognize_face_and_log_attendance(
    payload: FaceRecognizeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Decodes a base64 webcam frame, runs facial recognition against all enrolled students,
    and logs attendance (present/late) if a student is identified.
    """
    # 1. Decode base64 image
    frame = FaceService.decode_base64_image(payload.image)
    if frame is None or frame.size == 0:
        return FaceRecognizeResponse(
            success=False,
            message="Invalid image data sent from webcam."
        )

    # 2. Get active students with face encodings
    active_students = db.query(Student).filter(Student.is_active == True, Student.face_encoding != None).all()
    if not active_students:
        return FaceRecognizeResponse(
            success=False,
            message="No students registered with biometric profiles in the database."
        )

    # Re-structure for face_service input
    known_faces = [
        {
            "student_id": s.student_id,
            "name": s.name,
            "encoding_bytes": s.face_encoding
        }
        for s in active_students
    ]

    # 3. Match face
    student_id, confidence = FaceService.recognize_face_from_frame(frame, known_faces)
    
    if not student_id:
        return FaceRecognizeResponse(
            success=False,
            message="Face not recognized. Please adjust lighting or try again."
        )

    # Find the student record in DB
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        return FaceRecognizeResponse(
            success=False,
            message="Recognized student ID no longer exists in database."
        )

    # 4. Log attendance
    today_date = date.today()
    now_time = datetime.now().time()
    
    # Check if already marked for today
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.date == today_date
    ).first()

    if existing_attendance:
        return FaceRecognizeResponse(
            success=True,
            message="Attendance already recorded for today.",
            student_id=student.student_id,
            name=student.name,
            confidence=existing_attendance.confidence,
            status=existing_attendance.status
        )

    # Determine status (present vs late)
    late_time_limit = datetime.strptime(settings.LATE_THRESHOLD_TIME, "%H:%M:%S").time()
    if now_time > late_time_limit:
        attendance_status = "late"
    else:
        attendance_status = "present"

    # Create attendance record
    db_attendance = Attendance(
        student_id=student.id,
        date=today_date,
        time_in=now_time,
        status=attendance_status,
        confidence=confidence
    )

    try:
        db.add(db_attendance)
        db.commit()
        db.refresh(db_attendance)
        
        return FaceRecognizeResponse(
            success=True,
            message=f"Attendance marked successfully! Status: {attendance_status.capitalize()}",
            student_id=student.student_id,
            name=student.name,
            confidence=confidence,
            status=attendance_status
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record attendance: {str(e)}"
        )

@router.get("/today", response_model=List[AttendanceResponse])
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get all attendance logs recorded today.
    """
    today_date = date.today()
    records = db.query(Attendance).filter(
        Attendance.date == today_date
    ).order_by(Attendance.time_in.desc()).all()
    return records

@router.get("", response_model=List[AttendanceResponse])
def query_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Query attendance history with multiple filters: date ranges, roll numbers, status, and department.
    """
    query = db.query(Attendance).join(Student)
    
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if student_id:
        query = query.filter(Student.student_id == student_id)
    if status:
        query = query.filter(Attendance.status == status)
    if department:
        query = query.filter(Student.department == department)
        
    return query.order_by(Attendance.date.desc(), Attendance.time_in.desc()).all()
