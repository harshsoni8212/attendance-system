from sqlalchemy.orm import Session
from fastapi import HTTPException
import models


def create_class(db: Session, name: str, teacher_badge: str):

    # 🔍 Find teacher using badge number
    teacher = db.query(models.User).filter(
        models.User.badge_number == teacher_badge,
        models.User.role == "teacher"
    ).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # ✅ Create class using internal id
    new_class = models.Class(
        name=name,
        teacher_id=teacher.id
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return new_class