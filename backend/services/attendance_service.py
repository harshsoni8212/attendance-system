from sqlalchemy.orm import Session
from fastapi import HTTPException
from math import radians, cos, sin, sqrt, atan2
from datetime import datetime, timedelta
import asyncio
import models

from services.face_service import search_student_face
from services.websocket_manager import manager


# =====================================================
# Utility: Haversine Distance (meters)
# =====================================================
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius in meters

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


# =====================================================
# Start Attendance Session (Teacher)
# =====================================================
def start_session(
    db: Session,
    class_code: str,
    teacher_id: int,
    latitude: float,
    longitude: float,
    radius_meters: float
):
    # Find class only if it belongs to this teacher
    class_obj = db.query(models.Class).filter(
        models.Class.code == class_code,
        models.Class.teacher_id == teacher_id
    ).first()

    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found or unauthorized")

    # Close any existing active session for this class
    existing_session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.class_id == class_obj.id,
        models.AttendanceSession.is_active == True
    ).first()

    if existing_session:
        existing_session.is_active = False
        existing_session.ended_at = datetime.utcnow()
        db.commit()

    # Create new session
    session = models.AttendanceSession(
        class_id=class_obj.id,
        teacher_id=teacher_id,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius_meters,
        is_active=True
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Attendance session started",
        "session_id": session.id
    }


# =====================================================
# End Attendance Session (Teacher)
# =====================================================
def end_session(db: Session, session_id: int, teacher_id: int):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Active session not found")

    if session.teacher_id != teacher_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.is_active = False
    session.ended_at = datetime.utcnow()

    db.commit()

    return {"message": "Attendance session ended successfully"}


# =====================================================
# Mark Attendance (Student)
# =====================================================
def mark_attendance(
    db: Session,
    session_id: int,
    student_id: int,
    latitude: float,
    longitude: float,
    image_bytes: bytes
):
    # 1️⃣ Find active session
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.is_active == True
    ).first()

    if not session:
        raise HTTPException(status_code=400, detail="No active attendance session")

    # 2️⃣ Auto-expiry (30 minutes)
    if datetime.utcnow() - session.started_at > timedelta(minutes=30):
        session.is_active = False
        session.ended_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=400, detail="Attendance session expired")

    # 3️⃣ Get class linked to this session
    class_obj = session.class_

    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # 4️⃣ Validate student
    student = db.query(models.User).filter(
        models.User.id == student_id,
        models.User.role == "student"
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 5️⃣ Ensure student is enrolled in this class
    if student not in class_obj.students:
        raise HTTPException(status_code=403, detail="Student not enrolled in this class")

    # 6️⃣ Prevent duplicate attendance
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.session_id == session.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this session"
        )

    # 7️⃣ Geo-fencing check
    distance = calculate_distance(
        latitude,
        longitude,
        session.latitude,
        session.longitude
    )

    if distance > session.radius_meters:
        raise HTTPException(status_code=403, detail="Outside classroom radius")

    # 8️⃣ Face must be enrolled
    student_face = db.query(models.StudentFace).filter(
        models.StudentFace.student_id == student_id
    ).first()

    if not student_face:
        raise HTTPException(status_code=400, detail="Face not enrolled")

    # 9️⃣ Face verification
    matched_face_id = search_student_face(image_bytes)

    if not matched_face_id or matched_face_id != student_face.face_id:
        raise HTTPException(status_code=403, detail="Face verification failed")

    # 🔟 Save attendance
    attendance = models.Attendance(
        student_id=student_id,
        session_id=session.id,
        status="Present"
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    # =====================================================
    # 🚀 Real-Time WebSocket Broadcast
    # =====================================================
    try:
        asyncio.run(
            manager.broadcast({
                "event": "attendance_marked",
                "session_id": session.id,
                "student_name": student.name
            })
        )
    except Exception as e:
        print("WebSocket broadcast error:", e)

    return {"message": "Attendance marked successfully"}