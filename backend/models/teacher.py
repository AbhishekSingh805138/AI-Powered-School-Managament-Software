from pydantic import BaseModel, EmailStr
from typing import List

class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    subjects: List[str]
    qualification: str

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: str
    tenant_id: str
    created_at: str
    is_active: bool = True
