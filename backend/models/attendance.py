from pydantic import BaseModel
from typing import Optional

class AttendanceBase(BaseModel):
    student_id: str
    date: str
    status: str
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: str
    tenant_id: str
    created_at: str
