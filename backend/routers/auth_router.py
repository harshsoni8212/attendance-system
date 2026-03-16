from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models

# schemas
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserCreate

# auth utils
from auth.utils import verify_password, create_access_token, hash_password

# badge generator
from core.badge_generator import generate_badge

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ================= LOGIN =================

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "sub": user.email,
        "role": user.role
    })

    assigned_class = None

    # student -> enrolled class
    if user.role == "student" and user.enrolled_classes and len(user.enrolled_classes) > 0:
        assigned_class = user.enrolled_classes[0].name

    # teacher -> owned class
    elif user.role == "teacher" and user.classes and len(user.classes) > 0:
        assigned_class = user.classes[0].name

    return {
        "access_token": token,
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "badge_number": user.badge_number,
        "assigned_class": assigned_class
    }


# ================= REGISTER STUDENT =================

@router.post("/register-student")
def register_student(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    badge = generate_badge("STU")

    new_user = models.User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student",
        badge_number=badge
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Student registered successfully",
        "badge_number": badge
    }