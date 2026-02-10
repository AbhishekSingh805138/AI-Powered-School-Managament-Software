from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends
from models import Notification
from config.database import db
from core.dependencies import get_current_user
from utils.websocket import manager
from utils.security import decode_token
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.websocket("/ws")
async def websocket_notifications(websocket: WebSocket, token: str):
    try:
        user_id = decode_token(token)
        if not user_id:
            await websocket.close(code=1008)
            return
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            await websocket.close(code=1008)
            return
        
        await manager.connect(websocket, user_id, user["tenant_id"])
        
        try:
            while True:
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id, user["tenant_id"])
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()

@router.get("", response_model=List[Notification])
async def get_notifications(unread_only: bool = False, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"], "tenant_id": current_user["tenant_id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.delete_one(
        {"id": notification_id, "user_id": current_user["id"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}
