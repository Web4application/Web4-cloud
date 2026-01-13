# backend/main.py
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from auth import hash_password, verify_password, create_token, decode_token
from db import SessionLocal, init_db
from models import User, Project, AIModel, Log
from schemas import LoginData, TokenResponse, ProjectOut, AITask, AITaskResult
from typing import List

app = FastAPI()
init_db()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Login ---
@app.post("/api/login", response_model=TokenResponse)
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login==data.login).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user.login, "roles": user.roles})
    return {"token": token}

# --- Get Projects ---
@app.get("/api/projects", response_model=List[ProjectOut])
def get_projects(token: str, db: Session = Depends(get_db)):
    decoded = decode_token(token)
    roles = decoded.get("roles", [])
    if "ROLE_ADMIN" in roles:
        projects = db.query(Project).all()
    else:
        user = db.query(User).filter(User.login==decoded["sub"]).first()
        projects = db.query(Project).filter(Project.owner_user_id==user.id).all()
    return [{"projectId": p.project_id, "projectName": p.project_name, "login": p.login, "url": p.url} for p in projects]

# --- AI Task Endpoint ---
@app.post("/api/ai/{model_name}/task", response_model=AITaskResult)
def ai_task(model_name: str, task: AITask, token: str, db: Session = Depends(get_db)):
    decoded = decode_token(token)
    roles = decoded.get("roles", [])
    
    model = db.query(AIModel).filter(AIModel.model_name==model_name).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if not any(r in roles for r in model.access_roles):
        raise HTTPException(status_code=403, detail="Access denied")

    # Simulate AI result
    result = AITaskResult(projectId=task.projectId, taskType=task.taskType,
                          output=f"{model_name} processed {task.inputData}")

    # Log action
    user = db.query(User).filter(User.login==decoded["sub"]).first()
    db.add(Log(user_id=user.id, project_id=task.projectId, model_id=model.model_id,
               action="ai_task", details=task.dict()))
    db.commit()

    return result
