from datetime import datetime, timedelta
from app.celery import celery_app
from app.db import get_db
from app.services.github_auth import get_installation_access_token


@celery_app.task(bind=True, max_retries=3, default_retry_delay=20)
def ingest_push_task(
    self,
    installation_id: int,
    owner: str,
    repo_name: str,
    payload: dict,
):
    try:
        supabase = get_db()
        repo_full_name = f"{owner}/{repo_name}"

        # resolve user_id
        res = (
            supabase.table("github_installations")
            .select("user_id")
            .eq("installation_id", installation_id)
            .single()
            .execute()
        )

        if not res.data:
            return

        user_id = res.data["user_id"]

        commits = payload.get("commits", [])

        # -------------------------------------------------
        # 1️⃣ Activity log (commits)
        # -------------------------------------------------
        activity_rows = []

        for c in commits:
            author = c.get("author")

            if not author:
                continue

            activity_rows.append({
                "repo_full_name": repo_full_name,
                "github_user_id": None,
                "username": author.get("username"),
                "activity_type": "commit",
                "ref_id": c["id"],
                "title": c["message"].split("\n")[0],
                "url": c["url"],
                "created_at": c["timestamp"],
            })

        if activity_rows:
            supabase.table("repo_activity_log") \
                .upsert(
                    activity_rows,
                    on_conflict="repo_full_name,activity_type,ref_id",
                ) \
                .execute()

        # -------------------------------------------------
        # 2️⃣ Update dashboard snapshot (cheap update)
        # -------------------------------------------------
        since_30d = (datetime.utcnow() - timedelta(days=30)).isoformat()

        commits_30d = (
            supabase.table("repo_activity_log")
            .select("id", count="exact")
            .eq("repo_full_name", repo_full_name)
            .eq("activity_type", "commit")
            .gte("created_at", since_30d)
            .execute()
            .count
        )

        contributors = (
            supabase.table("repo_activity_log")
            .select("username", count="exact")
            .eq("repo_full_name", repo_full_name)
            .eq("activity_type", "commit")
            .gte("created_at", since_30d)
            .execute()
            .count
        )

        supabase.table("repo_dashboard_snapshot") \
            .update({
                "commits_30d": commits_30d,
                "contributors": contributors,
                "updated_at": datetime.utcnow().isoformat(),
            }) \
            .eq("repo_full_name", repo_full_name) \
            .execute()

    except Exception as exc:
        raise self.retry(exc=exc)
