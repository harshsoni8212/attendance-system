from sqlalchemy import Column, Integer, String, ForeignKey, Table, Boolean, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


# =====================================================
# Association Table (Students ↔ Classes Many-to-Many)
# =====================================================

class_students = Table(
    "class_students",
    Base.metadata,
    Column("class_id", Integer, ForeignKey("classes.id")),
    Column("student_id", Integer, ForeignKey("users.id")),
)


# =====================================================
# USER MODEL
# =====================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 Public Identifier (Student / Teacher)
    badge_number = Column(String, unique=True, index=True, nullable=True)

    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String, nullable=False)  # admin / teacher / student

    # Teacher → can own many classes
    classes = relationship("Class", back_populates="teacher")

    # Student → can enroll in many classes
    enrolled_classes = relationship(
        "Class",
        secondary=class_students,
        back_populates="students"
    )

    # Student → one face record
    face = relationship(
        "StudentFace",
        back_populates="student",
        uselist=False,
        cascade="all, delete"
    )


# =====================================================
# CLASS MODEL
# =====================================================

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 Public Identifier
    code = Column(String, unique=True, index=True)

    name = Column(String, nullable=False)

    teacher_id = Column(Integer, ForeignKey("users.id"))

    teacher = relationship("User", back_populates="classes")

    students = relationship(
        "User",
        secondary=class_students,
        back_populates="enrolled_classes"
    )

    sessions = relationship(
        "AttendanceSession",
        back_populates="class_",
        cascade="all, delete"
    )


# =====================================================
# ATTENDANCE SESSION MODEL
# =====================================================

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    #session_code = Column(String, unique=True, index=True)

    class_id = Column(Integer, ForeignKey("classes.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))

    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True)

    # 🔥 Geo-Fencing Fields
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Float, default=20)

    class_ = relationship("Class", back_populates="sessions")
    teacher = relationship("User")

    attendance_records = relationship(
        "Attendance",
        back_populates="session",
        cascade="all, delete"
    )


# =====================================================
# ATTENDANCE MODEL (Session-Based)
# =====================================================

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.id"))
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))

    timestamp = Column(DateTime, default=datetime.utcnow)

    status = Column(String, default="Present")

    student = relationship("User")
    session = relationship("AttendanceSession", back_populates="attendance_records")


# =====================================================
# STUDENT FACE MODEL
# =====================================================

class StudentFace(Base):
    __tablename__ = "student_faces"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("users.id"), unique=True)
    face_id = Column(String, nullable=False)

    student = relationship("User", back_populates="face")