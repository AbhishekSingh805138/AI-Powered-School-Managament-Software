from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import CORS_ORIGINS
from config.database import close_database
import logging

# Import all routers
from routers import auth, students, teachers, assignments, grades
from routers import attendance, fees, timetable, notifications
from routers import reports, schools, ai_chat, dashboard

# Create FastAPI app
app = FastAPI(
    title="EduPro School Management API",
    version="2.0.0",
    description="Modular multi-tenant school management system"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
app.include_router(grades.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(fees.router, prefix="/api")
app.include_router(timetable.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(schools.router, prefix="/api")
app.include_router(ai_chat.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_event():
    await close_database()
    logger.info("Database connection closed")

@app.get("/")
async def root():
    return {
        "message": "EduPro School Management API v2.0",
        "status": "running",
        "architecture": "modular"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
