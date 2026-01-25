from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from app.auth.supabase import get_current_user
from app.services.github_api_service import (
    get_manager_open_prs,
    get_manager_open_issues,
    create_github_issue,
    add_labels_to_issue,
)
from app.services.github_auth import get_installation_access_token
from app.db import get_db

router = APIRouter(prefix="/manager", tags=["Manager"])


# -------------------------------------------------
# Request Models
# -------------------------------------------------
class CreateIssueRequest(BaseModel):
    title: str
    description: str
    labels: list[str] | None = None
    assignees: list[str] | None = None


class AddTagsRequest(BaseModel):
    issue_id: int
    tags: list[str]


class BatchAddTagsRequest(BaseModel):
    issue_ids: list[int]
    tags: list[str]


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


# -------------------------------------------------
# Create New Issue
# -------------------------------------------------
@router.post("/issues")
def create_issue(
    repo: str = Query(...),
    payload: CreateIssueRequest = None,
    user=Depends(get_current_user),
):
    token, owner, repo_name = _get_repo_and_token(user["id"], repo)

    issue = create_github_issue(
        token=token,
        owner=owner,
        repo=repo_name,
        title=payload.title,
        description=payload.description,
        labels=payload.labels,
        assignees=payload.assignees,
    )

    return {"success": True, "issue": issue}


# -------------------------------------------------
# Add Tags to Single Issue
# -------------------------------------------------
@router.post("/issues/{issue_id}/tags")
def tag_issue(
    issue_id: int,
    repo: str = Query(...),
    payload: AddTagsRequest = None,
    user=Depends(get_current_user),
):
    token, owner, repo_name = _get_repo_and_token(user["id"], repo)

    result = add_labels_to_issue(
        token=token,
        owner=owner,
        repo=repo_name,
        issue_number=issue_id,
        labels=payload.tags,
    )

    return {"success": True, "issue_id": issue_id, "tags": payload.tags}


# -------------------------------------------------
# Batch Add Tags to Multiple Issues
# -------------------------------------------------
@router.post("/issues/batch-tags")
def batch_tag_issues(
    repo: str = Query(...),
    payload: BatchAddTagsRequest = None,
    user=Depends(get_current_user),
):
    token, owner, repo_name = _get_repo_and_token(user["id"], repo)

    results = []
    for issue_id in payload.issue_ids:
        try:
            add_labels_to_issue(
                token=token,
                owner=owner,
                repo=repo_name,
                issue_number=issue_id,
                labels=payload.tags,
            )
            results.append({"issue_id": issue_id, "success": True})
        except Exception as e:
            results.append({"issue_id": issue_id, "success": False, "error": str(e)})

    return {"success": True, "results": results, "tags_applied": payload.tags}
