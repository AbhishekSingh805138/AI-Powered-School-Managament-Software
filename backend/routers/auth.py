from fastapi import APIRouter, HTTPException, status, Depends
from models import User, UserCreate, UserLogin, Token
from config.database import db
from config.settings import ACCESS_TOKEN_EXPIRE_MINUTES
from utils.security import verify_password, get_password_hash, create_access_token
from core.dependencies import get_current_user
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=User)
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

@router.post("/login", response_model=Token)
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

@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
