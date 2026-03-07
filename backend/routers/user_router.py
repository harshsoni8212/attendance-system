from fastapi import APIRouter, Depends , UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import StudentCreate, UserResponse
from services.user_service import create_student
from services.face_service import index_student_face
from auth.dependencies import require_role
import models

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=UserResponse)
def register_student(
    data: StudentCreate,
    db: Session = Depends(get_db)
):
    return create_student(db, data)

@router.post("/enroll-face")
def enroll_own_face(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    
    existing = db.query(models.StudentFace).filter(
        models.StudentFace.student_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Face already enrolled"
        )
    image_bytes = file.file.read()

    face_id = index_student_face(image_bytes, current_user.id)

    student_face = models.StudentFace(
        student_id=current_user.id,
        face_id=face_id
    )

    db.add(student_face)
    db.commit()

    return {"message": "Face enrolled successfully"}

@router.get("/me")
def get_my_profile(
    current_user: models.User = Depends(require_role("student"))
):
    return current_user