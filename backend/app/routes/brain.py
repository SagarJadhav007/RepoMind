from fastapi import APIRouter, Depends
from app.brain.engine import run_brain
from app.brain.schema import BrainRequest, ChatRequest
from app.brain.roles import Role
from app.brain.task import TaskType
from app.auth.supabase import get_current_user

router = APIRouter(tags=["Chat"])

@router.post("/chat")
async def chat(                      
    repo_full_name: str,
    body: ChatRequest,
    user=Depends(get_current_user),
):
    req = BrainRequest(
        user_id=user["id"],
        repo_full_name=repo_full_name,
        role=Role.CONTRIBUTOR,
        task_type=TaskType.CHAT,
        payload={"message": body.message},
    )

    return await run_brain(req)      
