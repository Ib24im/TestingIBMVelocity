from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from datetime import datetime

from database import SessionLocal, engine
from models import Base, Todo, User
from schemas import TodoCreate, TodoUpdate, TodoResponse, UserCreate, UserResponse
from auth import get_current_user, create_access_token, verify_password
import crud

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Todo API",
    description="A modern Todo application with user authentication",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    """Root endpoint returning API information"""
    return {
        "message": "Todo API v2.0.0",
        "status": "active",
        "timestamp": datetime.now().isoformat()
    }

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = crud.get_user_by_email(db, email=user.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = crud.create_user(db=db, user=user)
    return db_user

@app.post("/auth/login")
async def login(email: str, password: str, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = crud.get_user_by_email(db, email=email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Todo endpoints
@app.get("/todos", response_model=List[TodoResponse])
async def get_todos(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all todos for the current user with optional filtering"""
    todos = crud.get_todos(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        category=category,
        priority=priority,
        completed=completed,
        search=search
    )
    return todos

@app.post("/todos", response_model=TodoResponse)
async def create_todo(
    todo: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new todo"""
    return crud.create_todo(db=db, todo=todo, user_id=current_user.id)

@app.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific todo by ID"""
    todo = crud.get_todo(db=db, todo_id=todo_id, user_id=current_user.id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific todo"""
    todo = crud.update_todo(
        db=db,
        todo_id=todo_id,
        todo_update=todo_update,
        user_id=current_user.id
    )
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

@app.delete("/todos/{todo_id}")
async def delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific todo"""
    success = crud.delete_todo(db=db, todo_id=todo_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted successfully"}

@app.get("/todos/stats/summary")
async def get_todo_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get todo statistics for the current user"""
    stats = crud.get_todo_stats(db=db, user_id=current_user.id)
    return stats

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
