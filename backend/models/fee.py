from pydantic import BaseModel
from typing import Optional

class FeeBase(BaseModel):
    student_id: str
    amount: float
    due_date: str
    description: str
    status: str

class FeeCreate(FeeBase):
    pass

class Fee(FeeBase):
    id: str
    tenant_id: str
    created_at: str
    paid_date: Optional[str] = None
