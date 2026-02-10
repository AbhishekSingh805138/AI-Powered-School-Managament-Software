from fastapi import APIRouter, HTTPException, Depends
from models import Assignment, AssignmentCreate
from config.database import db
from core.dependencies import get_current_user
from utils.notifications import create_notification
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("", response_model=Assignment)
async def create_assignment(assignment: AssignmentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["teacher", "school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assignment_id = str(uuid.uuid4())
    assignment_doc = {
        "id": assignment_id,
        "tenant_id": current_user["tenant_id"],
        **assignment.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.assignments.insert_one(assignment_doc)
    assignment_doc.pop("_id")
    
    # Send notifications to students
    students = await db.students.find({
        "tenant_id": current_user["tenant_id"],
        "grade": assignment.grade
    }, {"_id": 0}).to_list(1000)
    
    student_emails = [s["email"] for s in students]
    student_users = await db.users.find({
        "email": {"$in": student_emails},
        "role": "student"
    }, {"_id": 0}).to_list(1000)
    
    for student_user in student_users:
        await create_notification(
            title="New Assignment",
            message=f"New assignment '{assignment.title}' for {assignment.subject}. Due: {assignment.due_date}",
            notification_type="assignment",
            user_id=student_user["id"],
            tenant_id=current_user["tenant_id"]
        )
    
    return assignment_doc

@router.get("", response_model=List[Assignment])
async def get_assignments(grade: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if grade:
        query["grade"] = grade
    
    assignments = await db.assignments.find(query, {"_id": 0}).to_list(1000)
    return assignments
