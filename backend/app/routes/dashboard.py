from fastapi import APIRouter, Depends,Query
from app.auth.supabase import get_current_user
from app.db import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard")

@router.get("/")
def dashboard(repo: str, user=Depends(get_current_user)):
    supabase = get_db()

    # ✅ mark this repo as recently used
    supabase.table("recent_repo").upsert(
        {
            "user_id": user["id"],
            "repo": repo,
            "updated_at": datetime.utcnow().isoformat(),
        },
        on_conflict="user_id"
    ).execute()

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

@router.get("/activity")
def get_dashboard_activity(
    days: int = Query(1, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
    user=Depends(get_current_user),
):
    supabase = get_db()

    # 1️⃣ Get user's latest active repo
    repo_res = (
        supabase
        .table("repo_dashboard_snapshot")
        .select("repo_full_name")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )

    if not repo_res.data:
        return {"activities": []}

    repo = repo_res.data[0]["repo_full_name"]

    # 2️⃣ Fetch recent raw activity
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    raw = (
        supabase
        .table("repo_activity_log")
        .select("*")
        .eq("repo_full_name", repo)
        .gte("created_at", since)
        .order("created_at", desc=True)
        .execute()
        .data
    )

    # 3️⃣ Group activity
    grouped = {}

    for r in raw:
        key = (r["username"], r["activity_type"])

        if key not in grouped:
            grouped[key] = {
                "username": r["username"],
                "activity_type": r["activity_type"],
                "count": 0,
                "latest_title": r["title"],
                "latest_url": r["url"],
                "latest_at": r["created_at"],
            }

        grouped[key]["count"] += 1

    activities = list(grouped.values())

    # 4️⃣ Sort by recency
    activities.sort(
        key=lambda x: x["latest_at"],
        reverse=True
    )

    return {
        "repo": repo,
        "time_range_days": days,
        "activities": activities[:limit],
    }
