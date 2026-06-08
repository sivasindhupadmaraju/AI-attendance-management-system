from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
import csv
import io
from typing import Optional, Dict, Any, List

from ..database import get_db
from ..models.student import Student
from ..models.attendance import Attendance
from ..utils.dependencies import get_current_user, get_user_department_filter
from ..config import settings

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Returns high-level statistics for the dashboard cards.
    """
    today_date = date.today()
    
    # 1. Total Active Students
    student_query = db.query(Student).filter(Student.is_active == True)
    if dept_filter:
        student_query = student_query.filter(Student.department == dept_filter)
    total_students = student_query.count()
    
    # 2. Present Today (both present and late)
    present_query = db.query(Attendance).join(Student).filter(
        Attendance.date == today_date,
        Attendance.status.in_(["present", "late"])
    )
    if dept_filter:
        present_query = present_query.filter(Student.department == dept_filter)
    present_today = present_query.count()
    
    # 3. Late Today
    late_query = db.query(Attendance).join(Student).filter(
        Attendance.date == today_date,
        Attendance.status == "late"
    )
    if dept_filter:
        late_query = late_query.filter(Student.department == dept_filter)
    late_today = late_query.count()
    
    # 4. Absent Today (Active Students - Present/Late Today)
    absent_today = max(0, total_students - present_today)
    
    # 5. Attendance Rate Percentage
    attendance_rate = 0.0
    if total_students > 0:
        attendance_rate = round((present_today / total_students) * 100, 1)
        
    # 6. Department breakdown counts
    dept_breakdown = {}
    departments_query = db.query(Student.department).filter(Student.is_active == True)
    if dept_filter:
        departments_query = departments_query.filter(Student.department == dept_filter)
    departments = departments_query.distinct().all()
    
    for (dept,) in departments:
        if dept:
            dept_total = db.query(Student).filter(Student.department == dept, Student.is_active == True).count()
            dept_present = db.query(Attendance).join(Student).filter(
                Student.department == dept,
                Attendance.date == today_date,
                Attendance.status.in_(["present", "late"])
            ).count()
            dept_breakdown[dept] = {
                "total": dept_total,
                "present": dept_present,
                "absent": max(0, dept_total - dept_present)
            }

    return {
        "total_students": total_students,
        "present_today": present_today,
        "late_today": late_today,
        "absent_today": absent_today,
        "attendance_rate": attendance_rate,
        "department_breakdown": dept_breakdown
    }


@router.get("/daily-trends")
def get_daily_attendance_trends(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Returns daily attendance stats (Present vs Absent) for the past N days.
    Ideal for plotting trend charts in frontend.
    """
    today_date = date.today()
    trends = []
    
    total_active_query = db.query(Student).filter(Student.is_active == True)
    if dept_filter:
        total_active_query = total_active_query.filter(Student.department == dept_filter)
    total_active_students = total_active_query.count()
    
    for i in range(days - 1, -1, -1):
        target_date = today_date - timedelta(days=i)
        
        # Get count of present / late students on this day
        present_query = db.query(Attendance).join(Student).filter(
            Attendance.date == target_date,
            Attendance.status.in_(["present", "late"])
        )
        if dept_filter:
            present_query = present_query.filter(Student.department == dept_filter)
        present_count = present_query.count()
        
        late_query = db.query(Attendance).join(Student).filter(
            Attendance.date == target_date,
            Attendance.status == "late"
        )
        if dept_filter:
            late_query = late_query.filter(Student.department == dept_filter)
        late_count = late_query.count()
        
        absent_count = max(0, total_active_students - present_count)
        
        trends.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "display_date": target_date.strftime("%b %d"),
            "present": present_count,
            "late": late_count,
            "absent": absent_count,
            "attendance_rate": round((present_count / total_active_students * 100) if total_active_students > 0 else 0, 1)
        })
        
    return trends


@router.get("/export")
def export_attendance_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Queries attendance records based on filters and streams a downloadable CSV file.
    """
    query = db.query(Attendance).join(Student)
    
    # Restrict teacher to their department
    if dept_filter:
        department = dept_filter
        
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if status:
        query = query.filter(Attendance.status == status)
    if department:
        query = query.filter(Student.department == department)
    if student_id:
        query = query.filter(Student.student_id == student_id)
        
    records = query.order_by(Attendance.date.desc(), Attendance.time_in.desc()).all()
    
    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Record ID", "Student Roll No", "Name", "Department", "Semester", 
        "Attendance Date", "Period", "Time In", "Status", "Face Confidence Score", "Logged Timestamp"
    ])
    
    # Rows
    for record in records:
        writer.writerow([
            record.id,
            record.student.student_id,
            record.student.name,
            record.student.department,
            record.student.semester,
            record.date.strftime("%Y-%m-%d"),
            record.period,
            record.time_in.strftime("%H:%M:%S"),
            record.status.capitalize(),
            f"{record.confidence:.2f}" if record.confidence else "N/A",
            record.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])

        
    output.seek(0)
    
    # Setup response
    filename = f"attendance_report_{date.today().strftime('%Y-%m-%d')}.csv"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers=headers
    )


@router.get("/period-summary")
def get_period_summary(
    target_date: Optional[date] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    Returns attendance counts (present, late, absent) broken down by
    each configured class period for a given date.
    Defaults to today if no date is provided.
    """
    query_date = target_date or date.today()

    # Honour teacher department scoping
    effective_dept = dept_filter or department

    # Total active students (scoped)
    student_query = db.query(Student).filter(Student.is_active == True)
    if effective_dept:
        student_query = student_query.filter(Student.department == effective_dept)
    total_students = student_query.count()

    result = []
    for period in settings.PERIODS:
        period_name = period["name"]

        present_q = db.query(Attendance).join(Student).filter(
            Attendance.date == query_date,
            Attendance.period == period_name,
            Attendance.status == "present",
            Student.is_active == True,
        )
        late_q = db.query(Attendance).join(Student).filter(
            Attendance.date == query_date,
            Attendance.period == period_name,
            Attendance.status == "late",
            Student.is_active == True,
        )
        if effective_dept:
            present_q = present_q.filter(Student.department == effective_dept)
            late_q = late_q.filter(Student.department == effective_dept)

        present_count = present_q.count()
        late_count = late_q.count()
        marked_count = present_count + late_count
        absent_count = max(0, total_students - marked_count)
        rate = round((marked_count / total_students * 100) if total_students > 0 else 0, 1)

        result.append({
            "period_id": period["id"],
            "period": period_name,
            "start": period["start"],
            "end": period["end"],
            "present": present_count,
            "late": late_count,
            "absent": absent_count,
            "total": total_students,
            "attendance_rate": rate,
        })

    return {
        "date": query_date.strftime("%Y-%m-%d"),
        "department": effective_dept,
        "total_students": total_students,
        "periods": result,
    }
