from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db
from app.tasks.ingest_repo_files import ingest_repo_files
from app.auth.supabase import get_current_user

router = APIRouter()

# -------------------------------------------------
# Sync repo files from GitHub → Supabase + Embeddings
# -------------------------------------------------
@router.post("/repos/{repo_full_name:path}/files/sync")
def sync_repo_files(
    repo_full_name: str,
    user=Depends(get_current_user),
):
    """
    TEMP: Directly trigger repo ingestion + embeddings.
    Later this can be moved to a service / background job.
    """

    supabase = get_db()
    user_id = user["id"]

    # ---------------- Ownership / Access Check ---------------- #

    repo = (
        supabase
        .table("repo_dashboard_snapshot")
        .select("installation_id")
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not repo.data:
        raise HTTPException(
            status_code=404,
            detail="Repo not found or access denied",
        )

    installation_id = repo.data[0]["installation_id"]

    # ---------------- Trigger Ingestion ---------------- #

    return ingest_repo_files(
        repo_full_name=repo_full_name,
        installation_id=installation_id,
        user_id=user_id,
    )


# -------------------------------------------------
# Fetch repo files from DB
# -------------------------------------------------
@router.get("/repos/{repo_full_name:path}/files")
def get_repo_files(
    repo_full_name: str,
    user=Depends(get_current_user),
):
    supabase = get_db()
    user_id = user["id"]

    # ---------------- Ownership Check ---------------- #

    repo = (
        supabase
        .table("repo_dashboard_snapshot")
        .select("id")
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not repo.data:
        raise HTTPException(
            status_code=404,
            detail="Repo not found or access denied",
        )

    # ---------------- Fetch Files ---------------- #

    files = (
        supabase
        .table("repo_files")
        .select("path, content")
        .eq("repo_full_name", repo_full_name)
        .order("path")
        .execute()
    )

    return files.data
