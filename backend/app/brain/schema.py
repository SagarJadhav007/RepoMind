from pydantic import BaseModel
from typing import Optional, Dict, Any
from .roles import Role
from .task import TaskType

class BrainRequest(BaseModel):
    user_id: str
    repo_full_name: str
    role: Role
    task_type: TaskType
    source_id: Optional[str] = None  # PR number, issue id
    payload: Dict[str, Any]          # diff, issue text, chat msg

class BrainResponse(BaseModel):
    task_type: TaskType
    result: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
