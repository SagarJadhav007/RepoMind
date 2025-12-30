from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db
from app.auth.supabase import get_current_user
from app.services.github_repo_files import ingest_repo_files

router = APIRouter()

@router.post("/repos/{repo_full_name}/files/sync")
def sync_repo_files(
    repo_full_name: str,
    user=Depends(get_current_user),
):
    supabase = get_db()

    repo = (
        supabase.table("repo_dashboard_snapshot")
        .select("installation_id, user_id")
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not repo.data:
        raise HTTPException(404, "Repo not found")

    return ingest_repo_files(
        repo_full_name=repo_full_name,
        installation_id=repo.data["installation_id"],
        user_id=user.id,
    )
