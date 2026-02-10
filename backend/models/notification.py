from pydantic import BaseModel

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    user_id: str
    read: bool = False

class Notification(NotificationBase):
    id: str
    tenant_id: str
    created_at: str
