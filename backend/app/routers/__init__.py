from .auth import router as auth_router
from .students import router as students_router
from .attendance import router as attendance_router
from .reports import router as reports_router

__all__ = ["auth_router", "students_router", "attendance_router", "reports_router"]
