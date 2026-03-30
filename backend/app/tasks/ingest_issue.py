from datetime import datetime
from app.celery import celery_app
from app.db import get_db

@celery_app.task(bind=True, max_retries=3, default_retry_delay=20)
def ingest_issue_task(
    self,
    installation_id: int,
    owner: str,
    repo_name: str,
    payload: dict,
):
    try:
        supabase = get_db()
        repo_full_name = f"{owner}/{repo_name}"

        action = payload["action"]
        issue = payload["issue"]
        user = issue["user"]

        activity_type = f"issue_{action}"  # issue_opened, issue_closed

        row = {
            "repo_full_name": repo_full_name,
            "github_user_id": user.get("id"),
            "username": user.get("login"),
            "activity_type": activity_type,
            "ref_id": str(issue["id"]),
            "title": issue["title"],
            "url": issue["html_url"],
            "created_at": issue["created_at"],
        }

        supabase.table("repo_activity_log") \
            .upsert(
                row,
                on_conflict="repo_full_name,activity_type,ref_id",
            ) \
            .execute()

        # ---- dashboard snapshot ----
        open_issues = (
            supabase.table("repo_activity_log")
            .select("id", count="exact")
            .eq("repo_full_name", repo_full_name)
            .eq("activity_type", "issue_opened")
            .execute()
            .count
        )

        supabase.table("repo_dashboard_snapshot") \
            .update({
                "open_issues": open_issues,
                "updated_at": datetime.utcnow().isoformat(),
            }) \
            .eq("repo_full_name", repo_full_name) \
            .execute()

    except Exception as exc:
        raise self.retry(exc=exc)
