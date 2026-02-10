from fastapi import APIRouter, HTTPException, Depends
from models import Grade, GradeCreate
from config.database import db
from core.dependencies import get_current_user
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/grades", tags=["grades"])

@router.post("", response_model=Grade)
async def create_grade(grade: GradeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["teacher", "school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    grade_id = str(uuid.uuid4())
    grade_doc = {
        "id": grade_id,
        "tenant_id": current_user["tenant_id"],
        **grade.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.grades.insert_one(grade_doc)
    grade_doc.pop("_id")
    return grade_doc

@router.get("", response_model=List[Grade])
async def get_grades(student_id: Optional[str] = None, assignment_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if student_id:
        query["student_id"] = student_id
    if assignment_id:
        query["assignment_id"] = assignment_id
    
    grades = await db.grades.find(query, {"_id": 0}).to_list(1000)
    return grades
