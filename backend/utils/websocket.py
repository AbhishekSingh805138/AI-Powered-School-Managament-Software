from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, tenant_id: str):
        await websocket.accept()
        key = f"{tenant_id}:{user_id}"
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)
        logger.info(f"WebSocket connected: {key}")
    
    def disconnect(self, websocket: WebSocket, user_id: str, tenant_id: str):
        key = f"{tenant_id}:{user_id}"
        if key in self.active_connections:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
        logger.info(f"WebSocket disconnected: {key}")
    
    async def send_personal_notification(self, message: dict, user_id: str, tenant_id: str):
        key = f"{tenant_id}:{user_id}"
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_tenant(self, message: dict, tenant_id: str):
        for key, connections in self.active_connections.items():
            if key.startswith(f"{tenant_id}:"):
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()
