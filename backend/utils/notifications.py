from config.database import db
from utils.websocket import manager
import uuid
from datetime import datetime, timezone
from typing import Optional

async def create_notification(title: str, message: str, notification_type: str, user_id: str, tenant_id: str):
    """Create a notification and broadcast it via WebSocket"""
    notification = {
        "id": str(uuid.uuid4()),
        "title": title,
        "message": message,
        "type": notification_type,
        "user_id": user_id,
        "tenant_id": tenant_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notification)
    notification.pop("_id")
    
    await manager.send_personal_notification(notification, user_id, tenant_id)
    
    return notification

async def broadcast_notification(title: str, message: str, notification_type: str, tenant_id: str, exclude_user_id: Optional[str] = None):
    """Broadcast notification to all users in a tenant"""
    users = await db.users.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    
    for user in users:
        if exclude_user_id and user["id"] == exclude_user_id:
            continue
        await create_notification(title, message, notification_type, user["id"], tenant_id)
