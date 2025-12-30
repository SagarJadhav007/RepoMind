from fastapi import APIRouter, Request, Depends, Query
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import fetch_repositories , ingest_repo_snapshot
from app.auth.supabase import get_current_user
from app.db import get_db
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

class SyncRequest(BaseModel):
    installation_id: int
    repo: str


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
            "user_id": state,               # Supabase user id
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
def sync_dashboard(payload: SyncRequest):
    owner, repo_name = payload.repo.split("/")
    token = get_installation_access_token(payload.installation_id)

    return ingest_repo_snapshot(
        token,
        payload.installation_id,
        owner,
        repo_name
    )

@router.get("/repos")
def list_installation_repos(
    installation_id: int = Query(...),
    user = Depends(get_current_user),
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

@router.get("/installations")
def list_user_installations(user=Depends(get_current_user)):
    supabase = get_db()
    res = supabase.table("github_installations") \
        .select("installation_id") \
        .eq("user_id", user["sub"]) \
        .execute()

    return res.data

@router.get("/repos/available")
def list_user_repos(user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase
        .table("repo_snapshots")
        .select("repo_full_name")
        .eq("user_id", user["sub"])
        .execute()
    )

    return res.data
