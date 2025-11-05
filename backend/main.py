from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Task Manager API", "version": "2.0"}

@app.get("/tasks", response_model=List[schemas.Task])
def get_tasks(
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    
    if completed is not None:
        query = query.filter(models.Task.completed == completed)
    
    if priority:
        query = query.filter(models.Task.priority == priority)
    
    if category:
        query = query.filter(models.Task.category == category)
    
    if search:
        query = query.filter(
            models.Task.title.ilike(f"%{search}%") | 
            models.Task.description.ilike(f"%{search}%")
        )
    
    tasks = query.order_by(models.Task.created_at.desc()).all()
    return tasks

@app.post("/tasks", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/tasks/{task_id}", response_model=schemas.Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
    
    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}

@app.delete("/tasks")
def delete_multiple_tasks(task_ids: List[int], db: Session = Depends(get_db)):
    deleted_count = db.query(models.Task).filter(models.Task.id.in_(task_ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{deleted_count} tasks deleted successfully"}

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Task.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(models.Task).count()
    completed = db.query(models.Task).filter(models.Task.completed == True).count()
    active = total - completed
    
    high_priority = db.query(models.Task).filter(models.Task.priority == "high", models.Task.completed == False).count()
    
    overdue = db.query(models.Task).filter(
        models.Task.due_date < datetime.utcnow(),
        models.Task.completed == False
    ).count()
    
    return {
        "total": total,
        "active": active,
        "completed": completed,
        "high_priority": high_priority,
        "overdue": overdue
    }