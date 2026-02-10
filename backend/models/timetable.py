from pydantic import BaseModel

class TimetableBase(BaseModel):
    grade: str
    day: str
    period: int
    subject: str
    teacher_id: str
    start_time: str
    end_time: str

class TimetableCreate(TimetableBase):
    pass

class Timetable(TimetableBase):
    id: str
    tenant_id: str
    created_at: str
