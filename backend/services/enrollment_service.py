from sqlalchemy.orm import Session
from fastapi import HTTPException
import models


def enroll_student(
    db: Session,
    class_code: str,       # 🔥 public identifier
    student_badge: str,    # 🔥 public identifier
    teacher_id: int
):

    # 1️⃣ Find class using PUBLIC class_code
    class_obj = db.query(models.Class).filter(
        models.Class.code == class_code
    ).first()

    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # 2️⃣ Ensure teacher owns class
    if class_obj.teacher_id != teacher_id:
        raise HTTPException(status_code=403, detail="Not authorized for this class")

    # 3️⃣ Find student using PUBLIC badge
    student = db.query(models.User).filter(
        models.User.badge_number == student_badge,
        models.User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 4️⃣ Prevent duplicate enrollment
    if student in class_obj.students:
        raise HTTPException(status_code=400, detail="Student already enrolled")

    # 5️⃣ Enroll student
    class_obj.students.append(student)
    db.commit()

    return {"message": "Student enrolled successfully"}