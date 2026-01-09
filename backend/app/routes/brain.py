from fastapi import APIRouter, Depends
from app.brain.engine import run_brain
from app.brain.schema import BrainRequest
from app.brain.roles import Role
from app.brain.task import TaskType
from app.auth.supabase import get_current_user
from app.db import get_db

router = APIRouter(tags=["Chat"])

@router.post("/chat")
def chat(
    repo_full_name: str,
    body: BrainRequest,             
    user=Depends(get_current_user),
):
    req = BrainRequest(
        user_id=user["id"],
        repo_full_name=repo_full_name,
        role=Role.CONTRIBUTOR,
        task_type=TaskType.CHAT,
        payload={"message": body.message},
    )

    return run_brain(req)
