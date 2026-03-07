from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
import models
from auth.utils import hash_password
from core.badge_generator import generate_badge


# 🔹 Student Self Registration
def create_student(db: Session, data):

    badge = generate_badge("student")

    new_user = models.User(
        badge_number=badge,   # use generated badge
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student"
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")

    return new_user


# 🔹 Admin Creates Teacher
def create_teacher(db: Session, data):

    badge = generate_badge("teacher")

    new_user = models.User(
        badge_number=badge,   # use generated badge
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="teacher"
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")

    return new_user