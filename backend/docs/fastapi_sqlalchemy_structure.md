## **Overview**

This guide outlines how to structure and configure a **FastAPI** project to work seamlessly with a **PostgreSQL** database using **SQLAlchemy ORM**.

---

## **Core Python Files**

| #   | File                       | Purpose                                                 | Example Filename               |
| --- | -------------------------- | ------------------------------------------------------- | ------------------------------ |
| 1️⃣ | **Database Configuration** | Sets up DB connection, engine, session, and Base model  | `database.py`                  |
| 2️⃣ | **Models (ORM)**           | Defines database tables as Python classes               | `models.py`                    |
| 3️⃣ | **Schemas (Pydantic)**     | Handles request and response validation                 | `schemas.py`                   |
| 4️⃣ | **Routes / API Logic**     | Implements CRUD endpoints interacting with the database | `main.py` or `routes/tasks.py` |

---

## **1️⃣ `database.py` — Database Connection**

Handles connection setup, session management, and base class creation.

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

DATABASE_URL = os.getenv("DATABASE_URL")  # Example: postgresql://user:password@localhost:5432/taskdb

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## **2️⃣ `models.py` — Defining Tables**

Define your database tables using **SQLAlchemy ORM**.

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## **3️⃣ `schemas.py` — Request & Response Validation**

Create **Pydantic models** to define request bodies and serialize responses.

```python
from pydantic import BaseModel
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: str | None = None

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    completed: bool
    created_at: datetime

    class Config:
        orm_mode = True
```

---

## **4️⃣ `main.py` — FastAPI Application**

Your main entry point where **routes** and **database interactions** come together.

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/tasks/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    new_task = models.Task(**task.dict())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.get("/tasks/", response_model=list[schemas.Task])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()
```

---

## 🧠 **Memorization Trick: The Burger Analogy 🍔**

Think of your FastAPI app like a **burger**:

| Layer         | File          | Purpose                                    |
| ------------- | ------------- | ------------------------------------------ |
| 🥖 Top Bun    | `main.py`     | The API layer (what users interact with)   |
| 🥬 Lettuce    | `schemas.py`  | Cleans and validates data                  |
| 🍖 Patty      | `models.py`   | Represents the actual database tables      |
| 🥖 Bottom Bun | `database.py` | Supports everything with the DB connection |

👉 Without one layer, the burger (your app) falls apart!

---

## **Optional / Advanced Files**

| File             | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `crud.py`        | Encapsulates database operations and business logic    |
| `routes/` folder | Organize APIs by module (e.g., `tasks.py`, `users.py`) |
| `alembic/`       | Manage migrations and database version control         |

---

## **Summary**

The four key files — **`database.py`**, **`models.py`**, **`schemas.py`**, and **`main.py`** — form the **foundation** of a FastAPI + SQLAlchemy project.
Together, they handle everything from database connection and data modeling to request validation and API routing.

---


