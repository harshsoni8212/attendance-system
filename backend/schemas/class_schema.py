from pydantic import BaseModel
from typing import List

class ClassCreate(BaseModel):
    name: str
    teacher_badge: str   # 🔥 


class ClassResponse(BaseModel):
    id: int
    name: str
    teacher_id: int   # internal DB id (fine to return)

    class Config:
        from_attributes = True