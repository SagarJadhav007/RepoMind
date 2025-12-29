from fastapi import APIRouter, Depends, HTTPException
from app.auth.supabase import get_current_user
from app.services.dashboard_service import get_dashboard
from app.services.user_repo_service import get_active_repo

router = APIRouter(prefix="/dashboard")


@router.get("/")
def dashboard(user=Depends(get_current_user)):
    active = get_active_repo(user["sub"])
    if not active:
        raise HTTPException(404, "No active repo")

    data = get_dashboard(active["repo_full_name"])
    if not data:
        raise HTTPException(404, "Snapshot not found")

    return data
