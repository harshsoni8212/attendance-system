from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import require_role
from services.analytics_service import (
    class_attendance_summary,
    student_attendance_percentage
)
import models

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/class-summary")
def class_summary(
    class_code: str,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    return class_attendance_summary(db, class_code)


@router.get("/student-percentage")
def student_percentage(
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    return student_attendance_percentage(db, current_user.id)