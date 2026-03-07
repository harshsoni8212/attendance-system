from pydantic import BaseModel, EmailStr


# Student self registration
class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


# Admin creates teacher
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


# Standard user response
class UserResponse(BaseModel):
    badge_number: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True