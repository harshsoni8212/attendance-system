from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import require_role
import models
from datetime import datetime
from schemas.enrollment_schema import EnrollStudent
from services.enrollment_service import enroll_student
from services.attendance_service import manual_mark_attendance
from fastapi.responses import StreamingResponse
import csv
import io

router = APIRouter(prefix="/teacher", tags=["Teacher"])


# ======================================
# GET TEACHER PROFILE
# ======================================
@router.get("/me")
def get_teacher_profile(
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    assigned_class = None
    assigned_class_code = None

    if current_user.classes and len(current_user.classes) > 0:
        assigned_class = current_user.classes[0].name
        assigned_class_code = current_user.classes[0].code

    active_session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.teacher_id == current_user.id,
        models.AttendanceSession.is_active == True
    ).first()

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "badge_number": current_user.badge_number,
        "assigned_class": assigned_class,
        "assigned_class_code": assigned_class_code,
        "session_active": active_session is not None
    }


# ======================================
# ENROLL STUDENT
# ======================================
@router.post("/enroll-student")
def enroll_student_route(
    data: EnrollStudent,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    return enroll_student(
        db,
        data.class_code,
        data.student_badge,
        current_user.id
    )


# ======================================
# START SESSION
# ======================================
@router.post("/start-session")
def start_attendance_session(
    class_code: str,
    latitude: float,
    longitude: float,
    radius_meters: float = 20,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    class_obj = db.query(models.Class).filter(
        models.Class.code == class_code,
        models.Class.teacher_id == current_user.id
    ).first()

    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found or unauthorized")

    existing_session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.class_id == class_obj.id,
        models.AttendanceSession.is_active == True
    ).first()

    if existing_session:
        raise HTTPException(status_code=400, detail="Attendance session already active")

    new_session = models.AttendanceSession(
        class_id=class_obj.id,
        teacher_id=current_user.id,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        is_active=True
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "message": "Attendance session started",
        "session_id": new_session.id
    }


# ======================================
# END SESSION
# ======================================
@router.post("/end-session")
def end_attendance_session(
    session_id: int,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.teacher_id == current_user.id,
        models.AttendanceSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    session.is_active = False
    session.ended_at = datetime.utcnow()

    db.commit()

    return {"message": "Attendance session ended successfully"}

# ======================================
# MANUAL MARK ATTENDANCE
# ======================================
@router.post("/manual-mark")
def manual_mark_attendance_route(
    session_id: int,
    student_badge: str,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    return manual_mark_attendance(
        db=db,
        session_id=session_id,
        teacher_id=current_user.id,
        student_badge=student_badge
    )


# ======================================
# GET ACTIVE SESSION
# ======================================
@router.get("/active-session")
def get_active_session(
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.teacher_id == current_user.id,
        models.AttendanceSession.is_active == True
    ).first()

    if not session:
        return None

    return {
        "session_id": session.id,
        "class_name": session.class_.name,
        "is_active": session.is_active
    }


# ======================================
# GET SESSION ATTENDANCE
# ======================================
@router.get("/session-attendance/{session_id}")
def get_session_attendance(
    session_id: int,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.teacher_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    records = db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).all()

    result = []

    for record in records:
        result.append({
            "id": record.id,
            "student_name": record.student.name,
            "timestamp": record.timestamp
        })

    return result


# ======================================
# GET SESSION ANALYTICS
# ======================================
@router.get("/session-analytics/{session_id}")
def get_session_analytics(
    session_id: int,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.teacher_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    class_obj = session.class_

    total_students = len(class_obj.students)

    present_students = db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).count()

    absent_students = total_students - present_students

    attendance_rate = 0

    if total_students > 0:
        attendance_rate = round((present_students / total_students) * 100, 2)

    return {
        "total_students": total_students,
        "present_students": present_students,
        "absent_students": absent_students,
        "attendance_rate": attendance_rate
    }


# ======================================
# GET CLASS ANALYTICS
# ======================================
@router.get("/class-analytics")
def get_class_analytics(
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    class_obj = db.query(models.Class).filter(
        models.Class.teacher_id == current_user.id
    ).first()

    if not class_obj:
        return []

    students = class_obj.students
    result = []

    total_sessions = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.class_id == class_obj.id
    ).count()

    for student in students:
        present_count = db.query(models.Attendance).join(
            models.AttendanceSession
        ).filter(
            models.Attendance.student_id == student.id,
            models.AttendanceSession.class_id == class_obj.id
        ).count()

        percentage = 0

        if total_sessions > 0:
            percentage = round((present_count / total_sessions) * 100, 2)

        result.append({
            "student_name": student.name,
            "attendance_percentage": percentage
        })

    return result


# ======================================
# EXPORT ATTENDANCE CSV
# ======================================
@router.get("/export-attendance/{session_id}")
def export_attendance(
    session_id: int,
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.teacher_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    records = db.query(models.Attendance).filter(
        models.Attendance.session_id == session_id
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Student Name", "Timestamp"])

    for r in records:
        writer.writerow([r.student.name, r.timestamp])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_{session_id}.csv"
        },
    )


# ======================================
# GET SESSION HISTORY
# ======================================
@router.get("/session-history")
def get_session_history(
    current_user: models.User = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    class_obj = db.query(models.Class).filter(
        models.Class.teacher_id == current_user.id
    ).first()

    if not class_obj:
        return []

    sessions = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.class_id == class_obj.id
    ).order_by(models.AttendanceSession.started_at.desc()).all()

    result = []

    for session in sessions:
        present_count = db.query(models.Attendance).filter(
            models.Attendance.session_id == session.id
        ).count()

        total_students = len(class_obj.students)
        absent_count = total_students - present_count

        result.append({
            "session_id": session.id,
            "date": session.started_at,
            "present": present_count,
            "absent": absent_count
        })

    return result