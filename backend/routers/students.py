from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models import Student, StudentCreate
from config.database import db
from core.dependencies import get_current_user
from typing import List
import uuid
from datetime import datetime, timezone
import pandas as pd
import io

router = APIRouter(prefix="/students", tags=["students"])

@router.post("", response_model=Student)
async def create_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_id = str(uuid.uuid4())
    student_doc = {
        "id": student_id,
        "tenant_id": current_user["tenant_id"],
        **student.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.students.insert_one(student_doc)
    student_doc.pop("_id")
    return student_doc

@router.get("", response_model=List[Student])
async def get_students(current_user: dict = Depends(get_current_user)):
    students = await db.students.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return students

@router.get("/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=Student)
async def update_student(student_id: str, student: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.students.update_one(
        {"id": student_id, "tenant_id": current_user["tenant_id"]},
        {"$set": student.model_dump()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    return updated_student

@router.delete("/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.students.delete_one({"id": student_id, "tenant_id": current_user["tenant_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

@router.post("/bulk-import")
async def bulk_import_students(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        required_columns = ['first_name', 'last_name', 'email', 'grade', 'date_of_birth']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {', '.join(required_columns)}")
        
        students_added = 0
        for _, row in df.iterrows():
            student_doc = {
                "id": str(uuid.uuid4()),
                "tenant_id": current_user["tenant_id"],
                "first_name": str(row['first_name']),
                "last_name": str(row['last_name']),
                "email": str(row['email']),
                "grade": str(row['grade']),
                "date_of_birth": str(row['date_of_birth']),
                "parent_email": str(row.get('parent_email', '')),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }
            await db.students.insert_one(student_doc)
            students_added += 1
        
        return {"message": f"Successfully imported {students_added} students"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import CSV: {str(e)}")
