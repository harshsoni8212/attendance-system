from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import UserCreate, UserResponse
from services.user_service import create_student
from services.face_service import index_student_face, delete_student_face
from auth.dependencies import require_role
import models

router = APIRouter(prefix="/users", tags=["Users"])


# ================= REGISTER STUDENT =================
@router.post("/register", response_model=UserResponse)
def register_student(
    data: UserCreate,
    db: Session = Depends(get_db)
):
    return create_student(db, data)


# ================= ENROLL / RE-ENROLL FACE =================
@router.post("/enroll-face")
def enroll_own_face(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    image_bytes = file.file.read()

    # Check if face already exists
    existing = db.query(models.StudentFace).filter(
        models.StudentFace.student_id == current_user.id
    ).first()

    # If exists, delete old face from Rekognition + DB (re-enroll support)
    if existing:
        try:
            delete_student_face(existing.face_id)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to replace old face: {str(e)}"
            )

        db.delete(existing)
        db.commit()

    # Index new face
    face_id = index_student_face(image_bytes, current_user.id)

    # Save new face in DB
    student_face = models.StudentFace(
        student_id=current_user.id,
        face_id=face_id
    )

    db.add(student_face)
    db.commit()
    db.refresh(student_face)

    return {"message": "Face enrolled successfully"}


# ================= GET MY PROFILE =================
@router.get("/me")
def get_my_profile(
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    assigned_class = None

    if current_user.enrolled_classes and len(current_user.enrolled_classes) > 0:
        assigned_class = current_user.enrolled_classes[0].name

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "badge_number": current_user.badge_number,
        "face_enrolled": current_user.face is not None,
        "assigned_class": assigned_class
    }