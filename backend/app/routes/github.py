from fastapi import APIRouter, Request, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import (
    fetch_repositories,
    ingest_repo_snapshot,
)
from app.auth.supabase import get_current_user
from app.db import get_db

router = APIRouter(prefix="/github")


class SyncRequest(BaseModel):
    installation_id: int
    repo: str


# -------------------------------------------------
# GitHub App callback
# -------------------------------------------------
@router.get("/callback")
def github_callback(
    installation_id: int,
    state: str | None = None,
    setup_action: str | None = None,
):
    if not state:
        raise HTTPException(400, "Missing user state")

    supabase = get_db()

    supabase.table("github_installations").upsert(
        {
            "user_id": state,
            "installation_id": installation_id,
        },
        on_conflict="user_id,installation_id",
    ).execute()

    return RedirectResponse(
        url=f"http://localhost:8080/select-repo?installation_id={installation_id}"
    )


# -------------------------------------------------
# GitHub webhook (future)
# -------------------------------------------------
@router.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    print("Webhook received:", payload.get("action"))
    return {"status": "received"}


# -------------------------------------------------
# Sync repository (NEW OR OLD)
# -------------------------------------------------
@router.post("/sync")
def sync_dashboard(
    payload: SyncRequest,
    user=Depends(get_current_user),
):
    supabase = get_db()

    # 🔐 verify installation belongs to user
    inst = (
        supabase.table("github_installations")
        .select("installation_id")
        .eq("installation_id", payload.installation_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )

    if not inst.data:
        raise HTTPException(403, "Installation not owned by user")

    try:
        owner, repo_name = payload.repo.split("/", 1)
    except ValueError:
        raise HTTPException(400, "Invalid repo format")

    token = get_installation_access_token(payload.installation_id)

    return ingest_repo_snapshot(
        token=token,
        installation_id=payload.installation_id,
        owner=owner,
        repo_name=repo_name,
        user_id=user["id"],
    )


# -------------------------------------------------
# List repos in installation
# -------------------------------------------------
@router.get("/repos")
def list_installation_repos(
    installation_id: int = Query(...),
    user=Depends(get_current_user),
):
    supabase = get_db()

    inst = (
        supabase.table("github_installations")
        .select("installation_id")
        .eq("installation_id", installation_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )

    if not inst.data:
        raise HTTPException(403, "Installation not owned by user")

    token = get_installation_access_token(installation_id)
    repos = fetch_repositories(token)

    return [
        {
            "full_name": r["full_name"],
            "private": r["private"],
            "owner": r["owner"]["login"],
        }
        for r in repos
    ]


# -------------------------------------------------
# List user installations
# -------------------------------------------------
@router.get("/installations")
def list_user_installations(user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase.table("github_installations")
        .select("installation_id")
        .eq("user_id", user["id"])
        .execute()
    )

    return res.data


# -------------------------------------------------
# List synced repos (dashboard sidebar)
# -------------------------------------------------
@router.get("/repos/available")
def list_user_repos(user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase.table("repo_dashboard_snapshot")
        .select("repo_full_name")
        .eq("user_id", user["id"])
        .execute()
    )

    return res.data
