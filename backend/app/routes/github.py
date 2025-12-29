from fastapi import APIRouter, Request, Depends
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import fetch_repositories , ingest_repo_snapshot
from app.auth.supabase import get_current_user
from app.db import get_db

router = APIRouter(prefix="/github")

@router.get("/callback")
def github_callback(
    installation_id: int,
    state: str | None = None,  
    setup_action: str | None = None,
):
    if not state:
        return {"error": "Missing user state"}

    supabase = get_db()

    
    supabase.table("github_installations").upsert(
        {
            "user_id": state,
            "installation_id": installation_id,
        },
        on_conflict="user_id,installation_id"
    ).execute()

    
    return RedirectResponse(
        url=f"http://localhost:8080/select-repo?installation_id={installation_id}"
    )


@router.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    print("Webhook received:", payload.get("action"))
    return {"status": "received"}

@router.post("/sync")
def sync_dashboard(installation_id: int, repo: str):
    owner, repo_name = repo.split("/")
    token = get_installation_access_token(installation_id)
    return ingest_repo_snapshot(token, installation_id, owner, repo_name)

from fastapi import APIRouter, Query
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import fetch_repositories

router = APIRouter(prefix="/github", tags=["GitHub"])


@router.get("/repos")
def list_installation_repos(
    installation_id: int = Query(...)
):
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
