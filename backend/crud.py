from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from datetime import datetime, date

from models import User, Todo, PriorityLevel, CategoryType
from schemas import UserCreate, TodoCreate, TodoUpdate
from auth import get_password_hash

# User CRUD operations
def get_user(db: Session, user_id: int):
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    """Create a new user"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Todo CRUD operations
def get_todos(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get todos with optional filtering"""
    query = db.query(Todo).filter(Todo.owner_id == user_id)
    
    # Apply filters
    if category:
        query = query.filter(Todo.category == category)
    
    if priority:
        query = query.filter(Todo.priority == priority)
    
    if completed is not None:
        query = query.filter(Todo.completed == completed)
    
    if search:
        query = query.filter(
            or_(
                Todo.title.ilike(f"%{search}%"),
                Todo.description.ilike(f"%{search}%")
            )
        )
    
    return query.order_by(Todo.created_at.desc()).offset(skip).limit(limit).all()

def get_todo(db: Session, todo_id: int, user_id: int):
    """Get a specific todo by ID for a user"""
    return db.query(Todo).filter(
        and_(Todo.id == todo_id, Todo.owner_id == user_id)
    ).first()

def create_todo(db: Session, todo: TodoCreate, user_id: int):
    """Create a new todo"""
    db_todo = Todo(
        title=todo.title,
        description=todo.description,
        priority=todo.priority,
        category=todo.category,
        due_date=todo.due_date,
        owner_id=user_id
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def update_todo(db: Session, todo_id: int, todo_update: TodoUpdate, user_id: int):
    """Update a todo"""
    db_todo = get_todo(db, todo_id, user_id)
    if not db_todo:
        return None
    
    update_data = todo_update.model_dump(exclude_unset=True)
    
    # Handle completion status change
    if "completed" in update_data:
        if update_data["completed"] and not db_todo.completed:
            update_data["completed_at"] = datetime.utcnow()
        elif not update_data["completed"] and db_todo.completed:
            update_data["completed_at"] = None
    
    for field, value in update_data.items():
        setattr(db_todo, field, value)
    
    db.commit()
    db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int, user_id: int):
    """Delete a todo"""
    db_todo = get_todo(db, todo_id, user_id)
    if not db_todo:
        return False
    
    db.delete(db_todo)
    db.commit()
    return True

def get_todo_stats(db: Session, user_id: int):
    """Get todo statistics for a user"""
    total = db.query(Todo).filter(Todo.owner_id == user_id).count()
    completed = db.query(Todo).filter(
        and_(Todo.owner_id == user_id, Todo.completed == True)
    ).count()
    active = total - completed
    
    # Get overdue todos
    today = datetime.now().date()
    overdue = db.query(Todo).filter(
        and_(
            Todo.owner_id == user_id,
            Todo.completed == False,
            Todo.due_date < today
        )
    ).count()
    
    # Get todos due today
    due_today = db.query(Todo).filter(
        and_(
            Todo.owner_id == user_id,
            Todo.completed == False,
            func.date(Todo.due_date) == today
        )
    ).count()
    
    # Get stats by priority
    priority_stats = {}
    for priority in PriorityLevel:
        count = db.query(Todo).filter(
            and_(Todo.owner_id == user_id, Todo.priority == priority)
        ).count()
        priority_stats[priority.value] = count
    
    # Get stats by category
    category_stats = {}
    for category in CategoryType:
        count = db.query(Todo).filter(
            and_(Todo.owner_id == user_id, Todo.category == category)
        ).count()
        category_stats[category.value] = count
    
    return {
        "total": total,
        "completed": completed,
        "active": active,
        "overdue": overdue,
        "due_today": due_today,
        "by_priority": priority_stats,
        "by_category": category_stats
    }
