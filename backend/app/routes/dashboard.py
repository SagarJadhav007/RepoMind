from fastapi import APIRouter, Depends, HTTPException
from app.auth.supabase import get_current_user
from app.services.dashboard_service import get_dashboard
from app.services.user_repo_service import get_active_repo
from app.db import get_db

router = APIRouter(prefix="/dashboard")


@router.get("/")
def dashboard(repo: str, user=Depends(get_current_user)):
    supabase = get_db()

    data = (
        supabase
        .table("repo_snapshots")
        .select("*")
        .eq("repo_full_name", repo)
        .eq("user_id", user["id"])   
        .single()
        .execute()
    )

    if not data.data:
        raise HTTPException(
            status_code=404,
            detail="Repo not synced yet"
        )

    return data.data


