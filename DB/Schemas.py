# backend/schemas.py
from pydantic import BaseModel
from typing import List, Optional

class LoginData(BaseModel):
    login: str
    password: str

class TokenResponse(BaseModel):
    token: str

class ProjectOut(BaseModel):
    projectId: int
    projectName: str
    login: str
    url: str

class AITask(BaseModel):
    projectId: int
    taskType: str
    inputData: str

class AITaskResult(BaseModel):
    projectId: int
    taskType: str
    output: str
