from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.supabase import get_current_user
from app.brain.schema import BrainRequest, ChatRequest
from app.brain.task import TaskType
from app.brain.roles import Role
from app.brain.agent_router import AgentRouter
import asyncio

router = APIRouter(prefix="/chat")

agent_router = AgentRouter()

@router.post("")
async def chat(
    repo_full_name: str = Query(...),
    chat_req: ChatRequest = None,
    user=Depends(get_current_user),
):
    """
    Handle chat requests using the QueryAnsweringAgent
    """
    try:
        # Create BrainRequest
        brain_req = BrainRequest(
            user_id=user["id"],
            repo_full_name=repo_full_name,
            role=Role.USER,
            task_type=TaskType.CHAT,
            payload={"message": chat_req.message}
        )
        
        # Route to appropriate agent
        result = await agent_router.route(brain_req)
        
        return result
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pr-review")
async def review_pr(
    repo_full_name: str = Query(...),
    pr_number: int = Query(...),
    diff: str = Query(...),
    user=Depends(get_current_user),
):
    """
    Handle PR review requests using the PRReviewAgent
    """
    try:
        brain_req = BrainRequest(
            user_id=user["id"],
            repo_full_name=repo_full_name,
            role=Role.MAINTAINER,
            task_type=TaskType.PR_REVIEW,
            source_id=str(pr_number),
            payload={"diff": diff, "pr_number": pr_number}
        )
        
        result = await agent_router.route(brain_req)
        
        return result
        
    except Exception as e:
        print(f"PR review error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
