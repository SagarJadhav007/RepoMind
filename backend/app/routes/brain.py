from fastapi import APIRouter, Depends
from app.brain.engine import run_brain
from app.brain.schemas import BrainRequest
from app.brain.roles import Role
from app.brain.task import TaskType
from app.auth import get_current_user
from app.db import get_db

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/")
def chat(
    repo_full_name: str,
    message: str,
    user=Depends(get_current_user),
):
    req = BrainRequest(
        user_id=user.id,
        repo_full_name=repo_full_name,
        role=Role.CONTRIBUTOR,
        task_type=TaskType.CHAT,
        payload={"message": message},
    )

    result = run_brain(req)

    # optional logging
    db = get_db()
    db.table("chat_logs").insert({
        "user_id": user.id,
        "repo_full_name": repo_full_name,
        "message": message,
        "response": result.get("answer"),
    }).execute()

    return result
