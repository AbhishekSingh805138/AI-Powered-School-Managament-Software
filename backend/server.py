from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import pandas as pd
import io
import csv
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
ALGORITHM = os.environ.get('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, tenant_id: str):
        await websocket.accept()
        key = f"{tenant_id}:{user_id}"
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)
        logger.info(f"WebSocket connected: {key}")
    
    def disconnect(self, websocket: WebSocket, user_id: str, tenant_id: str):
        key = f"{tenant_id}:{user_id}"
        if key in self.active_connections:
            self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
        logger.info(f"WebSocket disconnected: {key}")
    
    async def send_personal_notification(self, message: dict, user_id: str, tenant_id: str):
        key = f"{tenant_id}:{user_id}"
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_tenant(self, message: dict, tenant_id: str):
        for key, connections in self.active_connections.items():
            if key.startswith(f"{tenant_id}:"):
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # super_admin, school_admin, teacher, student, parent
    tenant_id: Optional[str] = None  # School ID for multi-tenancy

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: str
    is_active: bool = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SchoolBase(BaseModel):
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str

class SchoolCreate(SchoolBase):
    pass

class School(SchoolBase):
    id: str
    tenant_id: str
    created_at: str
    is_active: bool = True

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    grade: str
    date_of_birth: str
    parent_email: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: str
    tenant_id: str
    created_at: str
    is_active: bool = True

class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    subjects: List[str]
    qualification: str

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: str
    tenant_id: str
    created_at: str
    is_active: bool = True

class AttendanceBase(BaseModel):
    student_id: str
    date: str
    status: str  # present, absent, late
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: str
    tenant_id: str
    created_at: str

class AssignmentBase(BaseModel):
    title: str
    description: str
    due_date: str
    subject: str
    teacher_id: str
    grade: str
    max_score: float

class AssignmentCreate(AssignmentBase):
    pass

class Assignment(AssignmentBase):
    id: str
    tenant_id: str
    created_at: str

class GradeBase(BaseModel):
    assignment_id: str
    student_id: str
    score: float
    feedback: Optional[str] = None

class GradeCreate(GradeBase):
    pass

class Grade(GradeBase):
    id: str
    tenant_id: str
    created_at: str

class TimetableBase(BaseModel):
    grade: str
    day: str  # Monday, Tuesday, etc.
    period: int
    subject: str
    teacher_id: str
    start_time: str
    end_time: str

class TimetableCreate(TimetableBase):
    pass

class Timetable(TimetableBase):
    id: str
    tenant_id: str
    created_at: str

class FeeBase(BaseModel):
    student_id: str
    amount: float
    due_date: str
    description: str
    status: str  # pending, paid, overdue

class FeeCreate(FeeBase):
    pass

class Fee(FeeBase):
    id: str
    tenant_id: str
    created_at: str
    paid_date: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    session_id: str

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "tenant_id": user.tenant_id,
        "hashed_password": hashed_password,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.users.insert_one(user_doc)
    user_doc.pop("hashed_password")
    user_doc.pop("_id")
    return user_doc

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email}, {"_id": 0})
    if not user or not verify_password(user_login.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# School Routes
@api_router.post("/schools", response_model=School)
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

@api_router.get("/schools", response_model=List[School])
async def get_schools(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "super_admin":
        schools = await db.schools.find({}, {"_id": 0}).to_list(1000)
    else:
        schools = await db.schools.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return schools

# Student Routes
@api_router.post("/students", response_model=Student)
async def create_student(student: StudentCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student_id = str(uuid.uuid4())
    student_doc = {
        "id": student_id,
        "tenant_id": current_user["tenant_id"],
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "grade": student.grade,
        "date_of_birth": student.date_of_birth,
        "parent_email": student.parent_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.students.insert_one(student_doc)
    student_doc.pop("_id")
    return student_doc

@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: dict = Depends(get_current_user)):
    students = await db.students.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@api_router.put("/students/{student_id}", response_model=Student)
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

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.students.delete_one({"id": student_id, "tenant_id": current_user["tenant_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

# Bulk Import Routes
@api_router.post("/students/bulk-import")
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

# Teacher Routes
@api_router.post("/teachers", response_model=Teacher)
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

@api_router.get("/teachers", response_model=List[Teacher])
async def get_teachers(current_user: dict = Depends(get_current_user)):
    teachers = await db.teachers.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return teachers

@api_router.post("/teachers/bulk-import")
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

# Attendance Routes
@api_router.post("/attendance", response_model=Attendance)
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

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(student_id: Optional[str] = None, date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if student_id:
        query["student_id"] = student_id
    if date:
        query["date"] = date
    
    attendance_records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance_records

# Assignment Routes
@api_router.post("/assignments", response_model=Assignment)
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
    return assignment_doc

@api_router.get("/assignments", response_model=List[Assignment])
async def get_assignments(grade: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if grade:
        query["grade"] = grade
    
    assignments = await db.assignments.find(query, {"_id": 0}).to_list(1000)
    return assignments

# Grade Routes
@api_router.post("/grades", response_model=Grade)
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

@api_router.get("/grades", response_model=List[Grade])
async def get_grades(student_id: Optional[str] = None, assignment_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if student_id:
        query["student_id"] = student_id
    if assignment_id:
        query["assignment_id"] = assignment_id
    
    grades = await db.grades.find(query, {"_id": 0}).to_list(1000)
    return grades

# Timetable Routes
@api_router.post("/timetable", response_model=Timetable)
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

@api_router.get("/timetable", response_model=List[Timetable])
async def get_timetable(grade: Optional[str] = None, day: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if grade:
        query["grade"] = grade
    if day:
        query["day"] = day
    
    timetable = await db.timetable.find(query, {"_id": 0}).sort("period", 1).to_list(1000)
    return timetable

# Fee Routes
@api_router.post("/fees", response_model=Fee)
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

@api_router.get("/fees", response_model=List[Fee])
async def get_fees(student_id: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"tenant_id": current_user["tenant_id"]}
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    
    fees = await db.fees.find(query, {"_id": 0}).to_list(1000)
    return fees

@api_router.put("/fees/{fee_id}/pay")
async def pay_fee(fee_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.fees.update_one(
        {"id": fee_id, "tenant_id": current_user["tenant_id"]},
        {"$set": {"status": "paid", "paid_date": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    return {"message": "Fee paid successfully"}

# AI Chat Routes
@api_router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(chat_message: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_message.session_id,
            system_message="You are an AI assistant for a school management system. Help users with questions about student management, attendance, grades, timetables, and general educational queries. Be helpful, professional, and concise."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=response,
            session_id=chat_message.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

# Dashboard Analytics
@api_router.get("/dashboard/stats")
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

# Reports Routes
@api_router.get("/reports/attendance")
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
    
    # Create CSV
    output = io.StringIO()
    if attendance_records:
        writer = csv.DictWriter(output, fieldnames=attendance_records[0].keys())
        writer.writeheader()
        writer.writerows(attendance_records)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_report.csv"}
    )

@api_router.get("/reports/grades")
async def generate_grades_report(grade: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all grades for the tenant
    grades = await db.grades.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(10000)
    
    # Get student and assignment details
    student_ids = list(set([g["student_id"] for g in grades]))
    assignment_ids = list(set([g["assignment_id"] for g in grades]))
    
    students = await db.students.find({"id": {"$in": student_ids}}, {"_id": 0}).to_list(10000)
    assignments = await db.assignments.find({"id": {"$in": assignment_ids}}, {"_id": 0}).to_list(10000)
    
    # Create lookup dictionaries
    student_map = {s["id"]: f"{s['first_name']} {s['last_name']}" for s in students}
    assignment_map = {a["id"]: a["title"] for a in assignments}
    
    # Enrich grades data
    report_data = []
    for g in grades:
        report_data.append({
            "student_name": student_map.get(g["student_id"], "Unknown"),
            "assignment": assignment_map.get(g["assignment_id"], "Unknown"),
            "score": g["score"],
            "feedback": g.get("feedback", ""),
            "created_at": g["created_at"]
        })
    
    # Filter by grade if specified
    if grade:
        student_ids_in_grade = [s["id"] for s in students if s.get("grade") == grade]
        report_data = [r for r in report_data if r["student_name"] in [student_map[sid] for sid in student_ids_in_grade]]
    
    # Create CSV
    output = io.StringIO()
    if report_data:
        writer = csv.DictWriter(output, fieldnames=report_data[0].keys())
        writer.writeheader()
        writer.writerows(report_data)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=grades_report.csv"}
    )

@api_router.get("/reports/students")
async def generate_students_report(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "school_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    students = await db.students.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(10000)
    
    # Create CSV
    output = io.StringIO()
    if students:
        writer = csv.DictWriter(output, fieldnames=students[0].keys())
        writer.writeheader()
        writer.writerows(students)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=students_report.csv"}
    )

# Email Notification Routes (Placeholder - activate with Resend API key)
class EmailNotification(BaseModel):
    recipient_email: EmailStr
    subject: str
    message: str

@api_router.post("/notifications/assignment")
async def send_assignment_notification(assignment_id: str, current_user: dict = Depends(get_current_user)):
    """
    Send email notification for new assignment.
    TODO: Add Resend API key to .env to activate email sending.
    RESEND_API_KEY=re_your_key_here
    """
    if current_user["role"] not in ["teacher", "school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    assignment = await db.assignments.find_one({"id": assignment_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get students in the grade
    students = await db.students.find({
        "tenant_id": current_user["tenant_id"],
        "grade": assignment["grade"]
    }, {"_id": 0}).to_list(1000)
    
    # Placeholder: Log instead of sending
    logger.info(f"[PLACEHOLDER] Would send assignment notification to {len(students)} students")
    logger.info(f"Assignment: {assignment['title']} - Due: {assignment['due_date']}")
    
    # When Resend is configured, this will actually send emails
    return {
        "status": "placeholder",
        "message": f"Email notifications prepared for {len(students)} students. Add RESEND_API_KEY to .env to activate.",
        "recipients": len(students)
    }

@api_router.post("/notifications/fee-reminder")
async def send_fee_reminder(student_id: str, current_user: dict = Depends(get_current_user)):
    """
    Send fee reminder email to parent.
    TODO: Add Resend API key to .env to activate email sending.
    """
    if current_user["role"] not in ["school_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    student = await db.students.find_one({"id": student_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    pending_fees = await db.fees.find({
        "tenant_id": current_user["tenant_id"],
        "student_id": student_id,
        "status": "pending"
    }, {"_id": 0}).to_list(100)
    
    total_pending = sum([fee["amount"] for fee in pending_fees])
    
    # Placeholder: Log instead of sending
    logger.info(f"[PLACEHOLDER] Would send fee reminder to {student['parent_email']}")
    logger.info(f"Student: {student['first_name']} {student['last_name']} - Total pending: ${total_pending}")
    
    return {
        "status": "placeholder",
        "message": f"Fee reminder prepared for {student['parent_email']}. Add RESEND_API_KEY to .env to activate.",
        "total_pending": total_pending,
        "fee_count": len(pending_fees)
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()