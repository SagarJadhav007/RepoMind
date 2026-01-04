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

        # -------------------------------------------------
        # Resolve RepoMind user_id
        # -------------------------------------------------
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

        sender = payload.get("sender") or {}
        commits = payload.get("commits", [])

        activity_rows = []

        for c in commits:
            commit_author = c.get("author") or {}

            # GitHub-safe fallback logic
            if commit_author.get("id"):
                github_user_id = commit_author["id"]
                username = commit_author.get("login")
            elif sender.get("id"):
                github_user_id = sender["id"]
                username = sender.get("login")
            else:
                continue  # ultra edge-case safety

            activity_rows.append({
                "repo_full_name": repo_full_name,
                "github_user_id": github_user_id,
                "username": username,
                "activity_type": "commit",
                "ref_id": c["id"],  # commit SHA (correct)
                "title": c["message"].split("\n")[0],
                "url": c["url"],
                "created_at": c["timestamp"],
            })

        # -------------------------------------------------
        # Insert activity log
        # -------------------------------------------------
        if activity_rows:
            supabase.table("repo_activity_log").upsert(
                activity_rows,
                on_conflict="repo_full_name,activity_type,ref_id",
            ).execute()

        # -------------------------------------------------
        # Update dashboard snapshot (last 30 days)
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
            .select("username", distinct=True, count="exact")
            .eq("repo_full_name", repo_full_name)
            .eq("activity_type", "commit")
            .gte("created_at", since_30d)
            .execute()
            .count
        )

        supabase.table("repo_dashboard_snapshot").update({
            "commits_30d": commits_30d,
            "contributors": contributors,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("repo_full_name", repo_full_name).execute()

    except Exception as exc:
        raise self.retry(exc=exc)
