from fastapi import APIRouter, Depends
from app.auth.supabase import get_current_user
from app.db import get_db

router = APIRouter(prefix="/dashboard")

@router.get("/")
def dashboard(repo: str, user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase
        .table("repo_dashboard_snapshot")
        .select("*")
        .eq("repo_full_name", repo)
        .eq("user_id", user["id"]) 
        .execute()
    )

    if not res.data:
        return {
            "status": "not_synced",
            "message": "Repository not synced yet",
            "repo": repo
        }

    return res.data[0]   
