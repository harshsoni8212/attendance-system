import random
import models
from sqlalchemy.orm import Session
from fastapi import HTTPException


def generate_class_code():
    return f"CLS-{random.randint(1000, 9999)}"


def create_class(db: Session, name: str):
    clean_name = name.strip()

    if not clean_name:
        raise HTTPException(status_code=400, detail="Class name is required")

    existing = db.query(models.Class).filter(
        models.Class.name.ilike(clean_name)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Class already exists")

    code = generate_class_code()

    while db.query(models.Class).filter(models.Class.code == code).first():
        code = generate_class_code()

    new_class = models.Class(
        name=clean_name,
        code=code,
        teacher_id=None
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return new_class