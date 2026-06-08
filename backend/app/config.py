import os

class Settings:
    PROJECT_NAME: str = "AI Smart Attendance System"
    API_V1_STR: str = "/api"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkeychangeinproduction1234567890!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./attendance.db")
    
    # Media Storage
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MEDIA_DIR: str = os.path.join(BASE_DIR, "student_images")
    
    # Attendance Configuration
    LATE_THRESHOLD_TIME: str = "09:00:00"  # Format: HH:MM:SS
    FACE_RECOGNITION_THRESHOLD: float = 0.50  # Distance threshold (lower = stricter)

    # Hour-wise Period Configuration
    # Format: id, name, start, end, late_threshold_minutes (from period start)
    PERIODS = [
        {"id": "1", "name": "Period 1 (9-10 AM)", "start": "09:00:00", "end": "09:59:59", "late_threshold_min": 10},
        {"id": "2", "name": "Period 2 (10-11 AM)", "start": "10:00:00", "end": "10:59:59", "late_threshold_min": 10},
        {"id": "3", "name": "Period 3 (11 AM-12 PM)", "start": "11:00:00", "end": "11:59:59", "late_threshold_min": 10},
        {"id": "4", "name": "Period 4 (12-1 PM)", "start": "12:00:00", "end": "12:59:59", "late_threshold_min": 10},
        {"id": "5", "name": "Period 5 (2-3 PM)", "start": "14:00:00", "end": "14:59:59", "late_threshold_min": 10},
        {"id": "6", "name": "Period 6 (3-4 PM)", "start": "15:00:00", "end": "15:59:59", "late_threshold_min": 10},
    ]


settings = Settings()

# Ensure media directory exists
os.makedirs(settings.MEDIA_DIR, exist_ok=True)

