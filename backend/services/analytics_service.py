from sqlalchemy.orm import Session
from sqlalchemy import func
import models


# ---------------------------------------------------
# Class Attendance Summary
# ---------------------------------------------------

def class_attendance_summary(db: Session, class_code: str):

    class_obj = db.query(models.Class).filter(
        models.Class.code == class_code
    ).first()

    if not class_obj:
        return {"error": "Class not found"}

    total_students = len(class_obj.students)

    total_attendance = db.query(models.Attendance).filter(
        models.Attendance.class_id == class_obj.id
    ).count()

    return {
        "class_name": class_obj.name,
        "total_students": total_students,
        "total_attendance_records": total_attendance
    }


# ---------------------------------------------------
# Student Attendance Percentage
# ---------------------------------------------------

def student_attendance_percentage(db: Session, student_id: int):

    total_classes = db.query(models.Attendance.class_id).filter(
        models.Attendance.student_id == student_id
    ).distinct().count()

    total_records = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id
    ).count()

    if total_classes == 0:
        return {"attendance_percentage": 0}

    percentage = (total_records / total_classes) * 100

    return {"attendance_percentage": round(percentage, 2)}