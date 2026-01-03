from fastapi import APIRouter, Depends, Query, HTTPException
from app.db import get_db
from app.auth.supabase import get_current_user

router = APIRouter(prefix="/contributors", tags=["Contributors"])


@router.get("")
def get_contributors(
    repo: str = Query(...),  # full repo name
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    user=Depends(get_current_user),
):
    supabase = get_db()
    offset = (page - 1) * limit

    # verify repo belongs to user
    exists = (
        supabase.table("repo_dashboard_snapshot")
        .select("id")
        .eq("user_id", user["id"])
        .eq("repo_full_name", repo)
        .single()
        .execute()
    )

    if not exists.data:
        raise HTTPException(403, "Repo not owned")

    total = (
        supabase.table("repo_contributors")
        .select("id", count="exact")
        .eq("repo_full_name", repo)
        .execute()
        .count
    )

    contributors = (
        supabase.table("repo_contributors")
        .select("*")
        .eq("repo_full_name", repo)
        .order("score", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "repo": repo,
        "page": page,
        "limit": limit,
        "total": total,
        "contributors": contributors.data,
    }
