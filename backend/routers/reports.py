from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from config.database import db
from core.dependencies import get_current_user
from typing import Optional
import io
import csv

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/attendance")
async def generate_attendance_report(start_date: Optional[str] = None, end_date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = {"tenant_id": current_user["tenant_id"]}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    attendance_records = await db.attendance.find(query, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    if attendance_records:
        writer = csv.DictWriter(output, fieldnames=attendance_records[0].keys())
        writer.writeheader()
        writer.writerows(attendance_records)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_report.csv"}
    )

@router.get("/grades")
async def generate_grades_report(grade: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    grades = await db.grades.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(10000)
    
    student_ids = list(set([g["student_id"] for g in grades]))
    assignment_ids = list(set([g["assignment_id"] for g in grades]))
    
    students = await db.students.find({"id": {"$in": student_ids}}, {"_id": 0}).to_list(10000)
    assignments = await db.assignments.find({"id": {"$in": assignment_ids}}, {"_id": 0}).to_list(10000)
    
    student_map = {s["id"]: f"{s['first_name']} {s['last_name']}" for s in students}
    assignment_map = {a["id"]: a["title"] for a in assignments}
    
    report_data = []
    for g in grades:
        report_data.append({
            "student_name": student_map.get(g["student_id"], "Unknown"),
            "assignment": assignment_map.get(g["assignment_id"], "Unknown"),
            "score": g["score"],
            "feedback": g.get("feedback", ""),
            "created_at": g["created_at"]
        })
    
    output = io.StringIO()
    if report_data:
        writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
        writer.writeheader()
        writer.writerows(report_data)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=grades_report.csv"}
    )

@router.get("/students")
async def generate_students_report(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    students = await db.students.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(10000)
    
    output = io.StringIO()
    if students:
        writer = csv.DictWriter(output, fieldnames=students[0].keys())
        writer.writeheader()
        writer.writerows(students)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=students_report.csv"}
    )
