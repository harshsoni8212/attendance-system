from fastapi import APIRouter, Depends , HTTPException
from sqlalchemy.orm import Session

from auth.dependencies import require_role
from database import get_db
from schemas.user import TeacherCreate,UserResponse
from services.user_service import create_teacher
import models
from schemas.class_schema import ClassCreate, ClassResponse
from services.class_service import create_class

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
def admin_dashboard(
    current_user: models.User = Depends(require_role("admin"))
):
    return {"message": f"Welcome Admin {current_user.name}"}


@router.post("/create-teacher",response_model=UserResponse)
def create_teacher_route(
    data: TeacherCreate,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return create_teacher(db, data)

@router.post("/create-class", response_model=ClassResponse)
def create_class_route(
    data: ClassCreate,
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    return create_class(db, data.name, data.teacher_badge)

@router.get("/teachers", response_model=list[UserResponse])
def get_teachers(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    teachers = db.query(models.User).filter(models.User.role == "teacher").all()
    return teachers

@router.post("/assign-class")
def assign_class_to_teacher(
    teacher_badge: str,
    class_code: str,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    teacher = db.query(models.User).filter(
        models.User.badge_number == teacher_badge
    ).first()

    class_ = db.query(models.Class).filter(
        models.Class.code == class_code
    ).first()

    if not teacher or not class_:
        raise HTTPException(status_code=404, detail="Teacher or class not found")

    class_.teacher_id = teacher.id
    db.commit()

    return {"message": "Class assigned"}