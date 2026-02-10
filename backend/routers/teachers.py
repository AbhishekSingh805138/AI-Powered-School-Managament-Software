from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models import Teacher, TeacherCreate
from config.database import db
from core.dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone
import pandas as pd
import io

router = APIRouter(prefix="/teachers", tags=["teachers"])

@router.post("", response_model=Teacher)
async def create_teacher(teacher: TeacherCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    teacher_id = str(uuid.uuid4())
    teacher_doc = {
        "id": teacher_id,
        "tenant_id": current_user["tenant_id"],
        **teacher.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.teachers.insert_one(teacher_doc)
    teacher_doc.pop("_id")
    return teacher_doc

@router.get("", response_model=List[Teacher])
async def get_teachers(current_user: dict = Depends(get_current_user)):
    teachers = await db.teachers.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return teachers

@router.post("/bulk-import")
async def bulk_import_teachers(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        required_columns = ['first_name', 'last_name', 'email', 'qualification']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_columns)}")
        
        teachers_added = 0
        for _, row in df.iterrows():
            subjects = str(row.get('subjects', '')).split(';') if 'subjects' in df.columns else []
            teacher_doc = {
                "id": str(uuid.uuid4()),
                "tenant_id": current_user["tenant_id"],
                "first_name": str(row['first_name']),
                "last_name": str(row['last_name']),
                "email": str(row['email']),
                "subjects": subjects,
                "qualification": str(row['qualification']),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }
            await db.teachers.insert_one(teacher_doc)
            teachers_added += 1
        
        return {"message": f"Successfully imported {teachers_added} teachers"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import CSV: {str(e)}")
