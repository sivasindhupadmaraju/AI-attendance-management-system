from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, time
from typing import List, Optional

from ..database import get_db
from ..models.student import Student
from ..models.attendance import Attendance
from ..schemas.attendance import AttendanceResponse, FaceRecognizeRequest, FaceRecognizeResponse
from ..services.face_service import FaceService
from ..utils.dependencies import get_current_user, get_user_department_filter
from ..config import settings

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/recognize", response_model=FaceRecognizeResponse)
def recognize_face_and_log_attendance(
    payload: FaceRecognizeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Decodes a base64 webcam frame, runs facial recognition against all enrolled students,
    maps check-in time to a specific class period/hour, and logs attendance (present/late).
    """
    # 1. Decode base64 image
    frame = FaceService.decode_base64_image(payload.image)
    if frame is None or frame.size == 0:
        return FaceRecognizeResponse(
            success=False,
            message="Invalid image data sent from webcam."
        )

    # 2. Get active students with face encodings (scoped to teacher department if applicable)
    student_query = db.query(Student).filter(Student.is_active == True, Student.face_encoding != None)
    if dept_filter:
        student_query = student_query.filter(Student.department == dept_filter)
    active_students = student_query.all()
    
    if not active_students:
        return FaceRecognizeResponse(
            success=False,
            message="No students registered with biometric profiles in this department."
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

    # Determine period/hour based on input or current time
    now_time = datetime.now().time()
    target_period = None
    late_threshold_min = 10
    period_start_time = None
    
    if payload.period and payload.period != "Auto-Detect":
        # Find matching configured period
        for p in settings.PERIODS:
            if p["name"] == payload.period or p["id"] == payload.period:
                target_period = p["name"]
                period_start_time = datetime.strptime(p["start"], "%H:%M:%S").time()
                late_threshold_min = p["late_threshold_min"]
                break
        if not target_period:
            target_period = payload.period  # fallback if customized string
    else:
        # Auto-detect period based on time
        for p in settings.PERIODS:
            p_start = datetime.strptime(p["start"], "%H:%M:%S").time()
            p_end = datetime.strptime(p["end"], "%H:%M:%S").time()
            if p_start <= now_time <= p_end:
                target_period = p["name"]
                period_start_time = p_start
                late_threshold_min = p["late_threshold_min"]
                break
        
        if not target_period:
            return FaceRecognizeResponse(
                success=False,
                message="No active class period at this hour. Please select a period manually."
            )

    # 4. Log attendance
    today_date = date.today()
    
    # Check if already marked for today in this period
    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.date == today_date,
        Attendance.period == target_period
    ).first()

    if existing_attendance:
        return FaceRecognizeResponse(
            success=True,
            message=f"Attendance already recorded for {target_period} today.",
            student_id=student.student_id,
            name=student.name,
            confidence=existing_attendance.confidence,
            status=existing_attendance.status,
            period=target_period
        )

    # Determine status (present vs late) based on the class start hour
    now_min = now_time.hour * 60 + now_time.minute
    if period_start_time:
        start_min = period_start_time.hour * 60 + period_start_time.minute
        late_limit_min = start_min + late_threshold_min
        if now_min > late_limit_min:
            attendance_status = "late"
        else:
            attendance_status = "present"
    else:
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
        period=target_period,
        confidence=confidence
    )

    try:
        db.add(db_attendance)
        db.commit()
        db.refresh(db_attendance)
        
        return FaceRecognizeResponse(
            success=True,
            message=f"Marked for {target_period}! Status: {attendance_status.capitalize()}",
            student_id=student.student_id,
            name=student.name,
            confidence=confidence,
            status=attendance_status,
            period=target_period
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
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Get all attendance logs recorded today.
    """
    today_date = date.today()
    query = db.query(Attendance).join(Student).filter(
        Attendance.date == today_date
    )
    if dept_filter:
        query = query.filter(Student.department == dept_filter)
        
    records = query.order_by(Attendance.time_in.desc()).all()
    return records


@router.get("", response_model=List[AttendanceResponse])
def query_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Query attendance history with multiple filters: date ranges, roll numbers, status, department, and period.
    """
    query = db.query(Attendance).join(Student)
    
    # Restrict teachers to their department
    if dept_filter:
        department = dept_filter
    
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
    if period:
        query = query.filter(Attendance.period == period)
        
    return query.order_by(Attendance.date.desc(), Attendance.time_in.desc()).all()

