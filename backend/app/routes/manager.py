from fastapi import APIRouter, Depends, Query
from app.auth.supabase import get_current_user
from app.services.github_api_service import (
    get_manager_open_prs,
    get_manager_open_issues,
)
from app.services.github_auth import get_installation_access_token
from app.services.github_installation_service import get_installation_id_for_user

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/pull-requests")
def manager_pull_requests(
    owner: str = Query(...),
    repo: str = Query(...),
    user = Depends(get_current_user),
):
    installation_id = get_installation_id_for_user(user["sub"])
    token = get_installation_access_token(installation_id)

    prs = get_manager_open_prs(token, owner, repo)
    return {
        "count": len(prs),
        "pull_requests": prs,
    }


@router.get("/issues")
def manager_issues(
    owner: str = Query(...),
    repo: str = Query(...),
    user = Depends(get_current_user),
):
    installation_id = get_installation_id_for_user(user["sub"])
    token = get_installation_access_token(installation_id)

    issues = get_manager_open_issues(token, owner, repo)
    return {
        "count": len(issues),
        "issues": issues,
    }
