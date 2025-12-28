from fastapi import APIRouter, Depends, Query
from app.services.github_api_service import (
    get_manager_open_prs,
    get_manager_open_issues,
)
from app.auth.github import get_installation_token  

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/pull-requests")
def manager_pull_requests(
    owner: str = Query(...),
    repo: str = Query(...),
    token: str = Depends(get_installation_token),
):
    prs = get_manager_open_prs(token, owner, repo)
    return {
        "count": len(prs),
        "pull_requests": prs,
    }


@router.get("/issues")
def manager_issues(
    owner: str = Query(...),
    repo: str = Query(...),
    token: str = Depends(get_installation_token),
):
    issues = get_manager_open_issues(token, owner, repo)
    return {
        "count": len(issues),
        "issues": issues,
    }
