from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models import PriorityLevel, CategoryType

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Todo schemas
class TodoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Todo title")
    description: Optional[str] = Field(None, max_length=1000, description="Optional description")
    priority: PriorityLevel = PriorityLevel.MEDIUM
    category: CategoryType = CategoryType.PERSONAL
    due_date: Optional[datetime] = None

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None
    priority: Optional[PriorityLevel] = None
    category: Optional[CategoryType] = None
    due_date: Optional[datetime] = None

class TodoResponse(TodoBase):
    id: int
    completed: bool
    created_at: datetime
    updated_at: Optional[datetime]
    completed_at: Optional[datetime]
    owner_id: int
    
    class Config:
        from_attributes = True

# Statistics schema
class TodoStats(BaseModel):
    total: int
    completed: int
    active: int
    overdue: int
    due_today: int
    by_priority: dict
    by_category: dict
