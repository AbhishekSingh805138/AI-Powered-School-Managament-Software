from pydantic import BaseModel, EmailStr

class SchoolBase(BaseModel):
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str

class SchoolCreate(SchoolBase):
    pass

class School(SchoolBase):
    id: str
    tenant_id: str
    created_at: str
    is_active: bool = True
