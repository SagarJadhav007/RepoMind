from datetime import datetime, timedelta
from app.celery import celery_app
from app.db import get_db


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

        commits = payload.get("commits", [])
        activity_rows = []

        for c in commits:
            author = c.get("author")

            # 🔴 skip commits without GitHub user
            if not author or not author.get("username"):
                continue

            activity_rows.append({
                "repo_full_name": repo_full_name,
                "github_user_id": author.get("id"),  # may still be None → safe skip above
                "username": author["username"],
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

        # --------- recompute counters (cheap)
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

        rows = (
            supabase.table("repo_activity_log")
            .select("username")
            .eq("repo_full_name", repo_full_name)
            .eq("activity_type", "commit")
            .gte("created_at", since_30d)
            .execute()
            .data
        )

        contributors = len({r["username"] for r in rows})

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
