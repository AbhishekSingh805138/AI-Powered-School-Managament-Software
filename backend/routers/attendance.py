from fastapi import APIRouter, HTTPException, Depends
from models import Attendance, AttendanceCreate
from config.database import db
from core.dependencies import get_current_user
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("", response_model=Attendance)
async def mark_attendance(attendance: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["teacher", "school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attendance_id = str(uuid.uuid4())
    attendance_doc = {
        "id": attendance_id,
        "tenant_id": current_user["tenant_id"],
        **attendance.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.attendance.insert_one(attendance_doc)
    attendance_doc.pop("_id")
    return attendance_doc

@router.get("", response_model=List[Attendance])
async def get_attendance(student_id: Optional[str] = None, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if student_id:
        query["student_id"] = student_id
    if date:
        query["date"] = date
    
    attendance_records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance_records
