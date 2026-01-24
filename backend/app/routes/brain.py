from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.auth.supabase import get_current_user
from app.brain.schema import BrainRequest
from app.brain.task import TaskType
from app.brain.roles import Role
from app.brain.agent_router import AgentRouter

router = APIRouter()

agent_router = AgentRouter()

class ChatPayload(BaseModel):
    message: str

@router.post("")
async def chat(
    payload: ChatPayload,
    repo_full_name: str = Query(...),
    user=Depends(get_current_user),
):
    """
    Handle chat requests using the QueryAnsweringAgent
    Returns natural text response with file name sources only
    """
    try:
        if not payload or not payload.message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Create BrainRequest
        brain_req = BrainRequest(
            user_id=user["id"],
            repo_full_name=repo_full_name,
            role=Role.USER,
            task_type=TaskType.CHAT,
            payload={"message": payload.message}
        )
        
        # Route to appropriate agent
        result = await agent_router.route(brain_req)
        
        # Ensure response is not JSON-wrapped
        response = {
            "answer": result.get("answer", result.get("text", "")),
            "sources": result.get("sources", []),
            "confidence": result.get("confidence", "medium"),
            "reasoning": result.get("reasoning", "")
        }
        
        return response
        
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pr-review")
async def review_pr(
    payload: dict,
    repo_full_name: str = Query(...),
    pr_number: int = Query(...),
    user=Depends(get_current_user),
):
    """
    Handle PR review requests using the PRReviewAgent
    """
    try:
        if not payload or "diff" not in payload:
            raise HTTPException(status_code=400, detail="Diff is required")
        
        brain_req = BrainRequest(
            user_id=user["id"],
            repo_full_name=repo_full_name,
            role=Role.MAINTAINER,
            task_type=TaskType.PR_REVIEW,
            source_id=str(pr_number),
            payload={"diff": payload["diff"], "pr_number": pr_number}
        )
        
        result = await agent_router.route(brain_req)
        
        return result
        
    except Exception as e:
        print(f"PR review error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
