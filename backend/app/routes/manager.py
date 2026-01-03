from fastapi import APIRouter, Depends, Query, HTTPException
from app.auth.supabase import get_current_user
from app.services.github_api_service import (
    get_manager_open_prs,
    get_manager_open_issues,
)
from app.services.github_auth import get_installation_access_token
from app.db import get_db

router = APIRouter(prefix="/manager", tags=["Manager"])


def _get_repo_and_token(user_id: str, repo_full_name: str):
    supabase = get_db()

    row = (
        supabase.table("repo_dashboard_snapshot")
        .select("installation_id")
        .eq("user_id", user_id)
        .eq("repo_full_name", repo_full_name)
        .single()
        .execute()
    )

    if not row.data:
        raise HTTPException(403, "Repo not owned or not synced")

    token = get_installation_access_token(row.data["installation_id"])
    owner, repo = repo_full_name.split("/")
    return token, owner, repo


@router.get("/pull-requests")
def manager_pull_requests(
    repo: str = Query(...),  # encoded full name
    user=Depends(get_current_user),
):
    repo = repo
    token, owner, repo_name = _get_repo_and_token(user["id"], repo)

    prs = get_manager_open_prs(token, owner, repo_name)
    return {"count": len(prs), "pull_requests": prs}


@router.get("/issues")
def manager_issues(
    repo: str = Query(...),
    user=Depends(get_current_user),
):
    token, owner, repo_name = _get_repo_and_token(user["id"], repo)

    issues = get_manager_open_issues(token, owner, repo_name)
    return {"count": len(issues), "issues": issues}
