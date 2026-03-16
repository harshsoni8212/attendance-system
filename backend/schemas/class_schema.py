from pydantic import BaseModel
from typing import Optional


class ClassCreate(BaseModel):
    name: str


class ClassResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    teacher_id: Optional[int] = None

    class Config:
        from_attributes = True