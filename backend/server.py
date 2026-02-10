from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import CORS_ORIGINS
from config.database import close_database
import logging

# Import routers
from routers import auth
from routers import students
# Will add more routers after creating them

# Create FastAPI app
app = FastAPI(title="EduPro School Management API", version="2.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(students.router, prefix="/api")
# More routers will be added here

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_event():
    await close_database()

@app.get("/")
async def root():
    return {"message": "EduPro School Management API v2.0", "status": "running"}
