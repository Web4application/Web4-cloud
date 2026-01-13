# backend/models.py
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    login = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    roles = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    project_id = Column(Integer, primary_key=True)
    project_name = Column(String, nullable=False)
    owner_user_id = Column(Integer, ForeignKey("users.id"))
    url = Column(String)
    login = Column(String)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIModel(Base):
    __tablename__ = "ai_models"
    model_id = Column(Integer, primary_key=True)
    model_name = Column(String, unique=True, nullable=False)
    tasks = Column(JSON, nullable=False)
    endpoint = Column(String, nullable=False)
    access_roles = Column(JSON, nullable=False)

class Log(Base):
    __tablename__ = "logs"
    log_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=True)
    model_id = Column(Integer, ForeignKey("ai_models.model_id"), nullable=True)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(JSON, nullable=True)
