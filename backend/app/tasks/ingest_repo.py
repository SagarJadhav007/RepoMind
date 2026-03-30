from app.celery import celery_app
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import ingest_repo_snapshot
from app.db import get_db


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def ingest_repo_task(
    self,
    installation_id: int,
    owner: str,
    repo_name: str,
    user_id: str | None,
):
    try:
        supabase = get_db()

        if not user_id:
            res = (
                supabase.table("github_installations")
                .select("user_id")
                .eq("installation_id", installation_id)
                .single()
                .execute()
            )

            if not res.data:
                raise ValueError("Installation not found")

            user_id = res.data["user_id"]

        token = get_installation_access_token(installation_id)

        return ingest_repo_snapshot(
            token=token,
            installation_id=installation_id,
            owner=owner,
            repo_name=repo_name,
            user_id=user_id,
        )

    except Exception as exc:
        raise self.retry(exc=exc)
