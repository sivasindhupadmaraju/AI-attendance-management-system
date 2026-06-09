import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.student import Student
from ..schemas.student import StudentResponse, StudentUpdate
from ..services.face_service import FaceService
from ..utils.dependencies import get_current_user, get_admin_user, get_user_department_filter
from ..config import settings

router = APIRouter(prefix="/students", tags=["students"])

@router.get("", response_model=List[StudentResponse])
def get_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    dept_filter: Optional[str] = Depends(get_user_department_filter)
):
    """
    List all students, with optional filters for search query (ID/Name), department, and semester.
    """
    query = db.query(Student)
    
    # Restrict teacher to their department
    if dept_filter:
        department = dept_filter
    
    if search:
        query = query.filter(
            (Student.name.ilike(f"%{search}%")) | 
            (Student.student_id.ilike(f"%{search}%"))
        )
        
    if department:
        query = query.filter(Student.department == department)

    if semester:
        query = query.filter(Student.semester == semester)
        
    students = query.all()
    
    # Custom semester ranking for numerical/logical sorting (1st -> 8th)
    sem_rank = {
        "1st": 1,
        "2nd": 2,
        "3rd": 3,
        "4th": 4,
        "5th": 5,
        "6th": 6,
        "7th": 7,
        "8th": 8
    }
    
    # Sort logically by semester rank, then by student roll ID
    students.sort(key=lambda s: (sem_rank.get(s.semester, 99), s.student_id))
    return students

@router.get("/{student_id_val}", response_model=StudentResponse)
def get_student(
    student_id_val: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Retrieve details of a single student by student_id or database PK id.
    """
    student = db.query(Student).filter(
        (Student.student_id == student_id_val) | 
        (Student.id.cast(Student.id.type) == student_id_val)
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return student

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_id: str = Form(...),
    name: str = Form(...),
    department: str = Form(...),
    semester: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Enroll a new student. Expects multipart form fields and a face image upload.
    Will run face detection; if no face is detected, the enrollment is rejected.
    """
    # Check if student ID already exists
    existing = db.query(Student).filter(Student.student_id == student_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with ID '{student_id}' is already enrolled."
        )

    if current_user.role == "teacher":
        department = current_user.department

    # Prepare file paths
    # Clean filename
    file_extension = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{student_id}{file_extension}"
    file_path = os.path.join(settings.MEDIA_DIR, filename)

    try:
        # Save upload to temporary location to check face encoding
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save student image file: {str(e)}"
        )

    # Process image for face encoding
    face_encoding_bytes = FaceService.get_face_encoding_from_image(file_path)
    
    if not face_encoding_bytes:
        # Clean up image file if face encoding fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No clear face detected in the uploaded image. Please upload a clear frontal portrait."
        )

    # Create new student database record
    db_student = Student(
        student_id=student_id,
        name=name,
        department=department,
        semester=semester,
        image_path=f"/student_images/{filename}",  # relative path for web access
        face_encoding=face_encoding_bytes,
        is_active=True
    )
    
    try:
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        return db_student
    except Exception as e:
        # Cleanup file on db error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database enrollment error: {str(e)}"
        )

@router.put("/{student_id_val}", response_model=StudentResponse)
def update_student(
    student_id_val: str,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Update basic student details (excluding face photo re-encoding).
    """
    student = db.query(Student).filter(
        (Student.student_id == student_id_val) | 
        (Student.id.cast(Student.id.type) == student_id_val)
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    if current_user.role == "teacher" and student.department != current_user.department:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update students in other departments")
        
    if current_user.role == "teacher" and student_in.department is not None:
        student_in.department = current_user.department
        
    # Update fields
    update_data = student_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
        
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{student_id_val}", status_code=status.HTTP_200_OK)
def delete_student(
    student_id_val: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Deletes a student record and removes their associated face image from disk.
    """
    student = db.query(Student).filter(
        (Student.student_id == student_id_val) | 
        (Student.id.cast(Student.id.type) == student_id_val)
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    if current_user.role == "teacher" and student.department != current_user.department:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete students in other departments")
        
    # Attempt to delete file from storage if path is stored
    if student.image_path:
        filename = os.path.basename(student.image_path)
        full_file_path = os.path.join(settings.MEDIA_DIR, filename)
        if os.path.exists(full_file_path):
            try:
                os.remove(full_file_path)
            except Exception as e:
                # Log error but proceed with database deletion
                print(f"Failed to delete file {full_file_path}: {e}")
                
    db.delete(student)
    db.commit()
    return {"detail": "Student and face profiles successfully deleted."}
