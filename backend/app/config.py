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

settings = Settings()

# Ensure media directory exists
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
