from pydantic import BaseModel

class AssignmentBase(BaseModel):
    title: str
    description: str
    due_date: str
    subject: str
    teacher_id: str
    grade: str
    max_score: float

class AssignmentCreate(AssignmentBase):
    pass

class Assignment(AssignmentBase):
    id: str
    tenant_id: str
    created_at: str
