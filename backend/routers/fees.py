from fastapi import APIRouter, HTTPException, Depends
from models import Fee, FeeCreate
from config.database import db
from core.dependencies import get_current_user
from utils.notifications import create_notification
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/fees", tags=["fees"])

@router.post("", response_model=Fee)
async def create_fee(fee: FeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    fee_id = str(uuid.uuid4())
    fee_doc = {
        "id": fee_id,
        "tenant_id": current_user["tenant_id"],
        **fee.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_date": None
    }
    
    await db.fees.insert_one(fee_doc)
    fee_doc.pop("_id")
    return fee_doc

@router.get("", response_model=List[Fee])
async def get_fees(student_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    
    fees = await db.fees.find(query, {"_id": 0}).to_list(1000)
    return fees

@router.put("/{fee_id}/pay")
async def pay_fee(fee_id: str, current_user: dict = Depends(get_current_user)):
    fee = await db.fees.find_one({"id": fee_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    result = await db.fees.update_one(
        {"id": fee_id, "tenant_id": current_user["tenant_id"]},
        {"$set": {"status": "paid", "paid_date": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    # Notify admins
    admins = await db.users.find({
        "tenant_id": current_user["tenant_id"],
        "role": {"$in": ["school_admin", "super_admin"]}
    }, {"_id": 0}).to_list(100)
    
    student = await db.students.find_one({"id": fee["student_id"]}, {"_id": 0})
    student_name = f"{student['first_name']} {student['last_name']}" if student else "Student"
    
    for admin in admins:
        await create_notification(
            title="Fee Payment Received",
            message=f"${fee['amount']} payment received for {student_name}",
            notification_type="fee",
            user_id=admin["id"],
            tenant_id=current_user["tenant_id"]
        )
    
    return {"message": "Fee paid successfully"}
