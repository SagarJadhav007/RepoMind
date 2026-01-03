from fastapi import APIRouter, Depends
from app.auth.supabase import get_current_user
from app.db import get_db
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import ingest_repo_snapshot

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/recent-repo")
def get_recent_repo(user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase
        .table("recent_repo")
        .select("repo")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )

    if res.data and len(res.data) > 0:
        return {"repo": res.data[0]["repo"]}

    return {"repo": None}

