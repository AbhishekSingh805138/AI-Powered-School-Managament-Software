from fastapi import APIRouter, Depends
from config.database import db
from core.dependencies import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    tenant_id = current_user["tenant_id"]
    
    total_students = await db.students.count_documents({"tenant_id": tenant_id, "is_active": True})
    total_teachers = await db.teachers.count_documents({"tenant_id": tenant_id, "is_active": True})
    total_assignments = await db.assignments.count_documents({"tenant_id": tenant_id})
    
    today = datetime.now(timezone.utc).date().isoformat()
    present_today = await db.attendance.count_documents({
        "tenant_id": tenant_id,
        "date": today,
        "status": "present"
    })
    
    pending_fees = await db.fees.count_documents({
        "tenant_id": tenant_id,
        "status": "pending"
    })
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_assignments": total_assignments,
        "present_today": present_today,
        "pending_fees": pending_fees
    }
