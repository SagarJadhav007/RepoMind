from fastapi import APIRouter, Depends, Query, HTTPException
from app.db import get_db
from app.auth.supabase import get_current_user

router = APIRouter(prefix="/contributors", tags=["Contributors"])


@router.get("")
def get_contributors(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    user=Depends(get_current_user),
):
    supabase = get_db()
    offset = (page - 1) * limit

    repo = (
        supabase.table("repo_dashboard_snapshot")
        .select("repo_full_name")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )

    if not repo.data:
        raise HTTPException(404, "No repository found")

    repo_full_name = repo.data[0]["repo_full_name"]

    # 2️⃣ Total contributors
    total = (
        supabase.table("repo_contributors")
        .select("id", count="exact")
        .eq("repo_full_name", repo_full_name)
        .execute()
        .count
    )

    # 3️⃣ Paginated contributors
    contributors = (
        supabase.table("repo_contributors")
        .select("*")
        .eq("repo_full_name", repo_full_name)
        .order("score", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "repo": repo_full_name,
        "page": page,
        "limit": limit,
        "total": total,
        "contributors": contributors.data,
    }
