from fastapi import APIRouter, Request, Depends, Query, HTTPException, Header
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.services.github_auth import (
    get_installation_access_token,
    verify_github_signature,
)
from app.services.github_api_service import (
    fetch_repositories,
    ingest_repo_snapshot,
)
from app.services.github_webhook_handlers import (
    handle_installation_event,
    handle_installation_repositories_event,
    handle_push_event,
    handle_pull_request_event,
    handle_issues_event,
)

from app.auth.supabase import get_current_user
from app.db import get_db

router = APIRouter(prefix="/github")


class SyncRequest(BaseModel):
    installation_id: int
    repo: str


# -------------------------------------------------
# GitHub App OAuth callback
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
        url=f"https://repomind-eight.vercel.app/select-repo?installation_id={installation_id}"
    )


# -------------------------------------------------
# GitHub Webhook
# -------------------------------------------------
@router.post("/webhook")
async def github_webhook(
    request: Request,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None),
):
    body = await request.body()
    verify_github_signature(x_hub_signature_256, body)
    payload = await request.json()

    event = x_github_event
    action = payload.get("action")
    installation_id = payload.get("installation", {}).get("id")

    print("🔥 EVENT:", event)
    print("🔥 ACTION:", action)
    print("🔥 INSTALLATION ID:", installation_id)

    if event == "installation":
        handle_installation_event(payload)

    elif event == "installation_repositories":
        handle_installation_repositories_event(payload)
        
    elif event == "push":
        handle_push_event(payload)

    elif event == "pull_request":
        handle_pull_request_event(payload)

    elif event == "issues":
        handle_issues_event(payload)

    # other events intentionally ignored for MVP
    return {"ok": True}


# -------------------------------------------------
# Manual sync (user selects repo)
# -------------------------------------------------
@router.post("/sync")
def sync_dashboard(
    payload: SyncRequest,
    user=Depends(get_current_user),
):
    supabase = get_db()

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
# Sidebar repos
# -------------------------------------------------
@router.get("/repos/available")
def list_user_repos(user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase.table("repo_dashboard_snapshot")
        .select("repo_full_name")
        .eq("user_id", user["id"])
        .eq("active", True)
        .execute()
    )

    return res.data
