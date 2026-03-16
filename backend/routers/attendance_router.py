from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import require_role
from services.attendance_service import mark_attendance
import models

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ================= MARK ATTENDANCE =================
@router.post("/mark")
def mark_attendance_route(
    session_id: int = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    image_bytes = file.file.read()

    return mark_attendance(
        db=db,
        session_id=session_id,
        student_id=current_user.id,
        latitude=latitude,
        longitude=longitude,
        image_bytes=image_bytes
    )


# ================= GET ACTIVE SESSION =================
@router.get("/active-session")
def get_active_session(
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):

    student = db.query(models.User).filter(
        models.User.id == current_user.id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Correct relationship name
    class_obj = student.enrolled_classes[0] if student.enrolled_classes else None

    if not class_obj:
        return None

    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.class_id == class_obj.id,
        models.AttendanceSession.is_active == True
    ).first()

    if not session:
        return None

    return {
        "session_id": session.id,
        "class_name": class_obj.name,
        "is_active": session.is_active
    }


# ================= STUDENT HISTORY =================
@router.get("/my-history")
def get_my_attendance(
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):

    records = db.query(models.Attendance).filter(
        models.Attendance.student_id == current_user.id
    ).order_by(models.Attendance.timestamp.desc()).all()

    result = []

    for record in records:
        result.append({
            "id": record.id,
            "class_name": record.session.class_.name,
            "timestamp": record.timestamp,
            "status": record.status
        })

    return result


# ================= STUDENT ANALYTICS =================
@router.get("/my-analytics")
def get_my_analytics(
    current_user: models.User = Depends(require_role("student")),
    db: Session = Depends(get_db)
):
    # get student's enrolled class
    class_obj = current_user.enrolled_classes[0] if current_user.enrolled_classes else None

    if not class_obj:
        return {
            "total_classes": 0,
            "present": 0,
            "absent": 0,
            "attendance_percentage": 0
        }

    # only sessions of student's class
    total_sessions = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.class_id == class_obj.id
    ).count()

    # only attendance records of this student in that class
    present = db.query(models.Attendance).join(
        models.AttendanceSession
    ).filter(
        models.Attendance.student_id == current_user.id,
        models.AttendanceSession.class_id == class_obj.id
    ).count()

    absent = total_sessions - present

    percentage = 0
    if total_sessions > 0:
        percentage = round((present / total_sessions) * 100, 2)

    return {
        "total_classes": total_sessions,
        "present": present,
        "absent": absent,
        "attendance_percentage": percentage
    }