from pydantic import BaseModel

class EnrollStudent(BaseModel):
    class_code: str
    student_badge: str