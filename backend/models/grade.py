from pydantic import BaseModel
from typing import Optional

class GradeBase(BaseModel):
    assignment_id: str
    student_id: str
    score: float
    feedback: Optional[str] = None

class GradeCreate(GradeBase):
    pass

class Grade(GradeBase):
    id: str
    tenant_id: str
    created_at: str
