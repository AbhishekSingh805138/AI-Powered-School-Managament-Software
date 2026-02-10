from fastapi import APIRouter, HTTPException, Depends
from models import School, SchoolCreate
from config.database import db
from core.dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/schools", tags=["schools"])

@router.post("", response_model=School)
async def create_school(school: SchoolCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    school_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    
    school_doc = {
        "id": school_id,
        "tenant_id": tenant_id,
        "name": school.name,
        "address": school.address,
        "contact_email": school.contact_email,
        "contact_phone": school.contact_phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.schools.insert_one(school_doc)
    school_doc.pop("_id")
    return school_doc

@router.get("", response_model=List[School])
async def get_schools(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "super_admin":
        schools = await db.schools.find({}, {"_id": 0}).to_list(1000)
    else:
        schools = await db.schools.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return schools
