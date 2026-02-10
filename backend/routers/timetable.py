from fastapi import APIRouter, HTTPException, Depends
from models import Timetable, TimetableCreate
from config.database import db
from core.dependencies import get_current_user
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/timetable", tags=["timetable"])

@router.post("", response_model=Timetable)
async def create_timetable(timetable: TimetableCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    timetable_id = str(uuid.uuid4())
    timetable_doc = {
        "id": timetable_id,
        "tenant_id": current_user["tenant_id"],
        **timetable.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.timetable.insert_one(timetable_doc)
    timetable_doc.pop("_id")
    return timetable_doc

@router.get("", response_model=List[Timetable])
async def get_timetable(grade: Optional[str] = None, day: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if grade:
        query["grade"] = grade
    if day:
        query["day"] = day
    
    timetable = await db.timetable.find(query, {"_id": 0}).sort("period", 1).to_list(1000)
    return timetable
