from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.brain.roles import Role
from app.brain.task import TaskType

class BrainRequest(BaseModel):
    user_id: str
    repo_full_name: str
    role: Role
    task_type: TaskType
    source_id: Optional[str] = None
    payload: Dict[str, Any]

class BrainResponse(BaseModel):
    task_type: TaskType
    result: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
