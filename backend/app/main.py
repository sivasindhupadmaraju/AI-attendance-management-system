import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base
from .routers import auth_router, students_router, attendance_router, reports_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Face-Recognition Biometric Attendance Management System API",
    version="1.0.0"
)

# Set CORS origins
origins = [
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount student images directory for static serving
if not os.path.exists(settings.MEDIA_DIR):
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)

app.mount("/student_images", StaticFiles(directory=settings.MEDIA_DIR), name="student_images")

# Mount Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}")
app.include_router(students_router, prefix=f"{settings.API_V1_STR}")
app.include_router(attendance_router, prefix=f"{settings.API_V1_STR}")
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}")

@app.get("/")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

# Health check endpoint
@app.get("/health")
def health():
    """Simple health check returning plain text."""
    return "ok"
