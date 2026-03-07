from pydantic import BaseModel

class MarkAttendance(BaseModel):
    class_id: int
    student_id: int