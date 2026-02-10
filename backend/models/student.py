from pydantic import BaseModel, EmailStr
from typing import Optional

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    grade: str
    date_of_birth: str
    parent_email: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: str
    tenant_id: str
    created_at: str
    is_active: bool = True
