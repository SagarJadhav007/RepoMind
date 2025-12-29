from fastapi import APIRouter, Depends
from app.auth.supabase import get_current_user
from app.db import get_db
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import ingest_repo_snapshot

router = APIRouter(prefix="/user", tags=["User"])


@router.post("/select-repo")
def select_repo(payload: dict, user=Depends(get_current_user)):
    installation_id = payload["installation_id"]
    repo_full_name = payload["repo_full_name"]

    supabase = get_db()

    supabase.table("user_repos") \
        .update({"active": False}) \
        .eq("user_id", user["sub"]) \
        .execute()

    
    supabase.table("user_repos").upsert(
        {
            "user_id": user["sub"],
            "installation_id": installation_id,
            "repo_full_name": repo_full_name,
            "active": True,
        },
        on_conflict="user_id,repo_full_name"
    ).execute()

    
    owner, repo = repo_full_name.split("/")
    token = get_installation_access_token(installation_id)
    ingest_repo_snapshot(token, installation_id, owner, repo)

    return {"status": "ok"}
