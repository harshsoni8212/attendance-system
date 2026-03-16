from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth.dependencies import require_role
from database import get_db
from schemas.user import TeacherCreate, UserResponse
from schemas.class_schema import ClassCreate, ClassResponse

from services.user_service import create_teacher
from services.class_service import create_class

import models

router = APIRouter(prefix="/admin", tags=["Admin"])


# =========================
# REQUEST SCHEMA FOR ASSIGN CLASS
# =========================
class AssignClassRequest(BaseModel):
    teacher_badge: str
    class_code: str


# =========================
# ADMIN DASHBOARD
# =========================
@router.get("/dashboard")
def admin_dashboard(
    current_user: models.User = Depends(require_role("admin"))
):
    return {"message": f"Welcome Admin {current_user.name}"}


# =========================
# CREATE TEACHER
# =========================
@router.post("/create-teacher", response_model=UserResponse)
def create_teacher_route(
    data: TeacherCreate,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return create_teacher(db, data)


# =========================
# CREATE CLASS
# =========================
@router.post("/create-class", response_model=ClassResponse)
def create_class_route(
    data: ClassCreate,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return create_class(db, data.name)


# =========================
# GET ALL TEACHERS
# =========================
@router.get("/teachers", response_model=list[UserResponse])
def get_teachers(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    teachers = db.query(models.User).filter(models.User.role == "teacher").all()
    return teachers


# =========================
# GET ALL CLASSES
# =========================
@router.get("/classes", response_model=list[ClassResponse])
def get_classes(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return db.query(models.Class).all()


# =========================
# ASSIGN CLASS TO TEACHER
# =========================
@router.post("/assign-class")
def assign_class_to_teacher(
    data: AssignClassRequest,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    teacher = db.query(models.User).filter(
        models.User.badge_number == data.teacher_badge,
        models.User.role == "teacher"
    ).first()

    class_ = db.query(models.Class).filter(
        models.Class.code == data.class_code
    ).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")

    class_.teacher_id = teacher.id
    db.commit()
    db.refresh(class_)

    return {"message": "Class assigned successfully"}