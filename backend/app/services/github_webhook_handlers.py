from datetime import datetime
from app.db import get_db
from app.tasks.ingest_repo import ingest_repo_task
from app.tasks.ingest_push import ingest_push_task
from app.tasks.ingest_pull_request import ingest_pull_request_task
from app.tasks.ingest_issue import ingest_issue_task

# -------------------------------------------------
# Installation lifecycle
# -------------------------------------------------
def handle_installation_event(payload: dict):
    action = payload.get("action")
    installation_id = payload["installation"]["id"]

    supabase = get_db()

    if action == "deleted":
        supabase.table("github_installations") \
            .update({"deleted_at": datetime.utcnow().isoformat()}) \
            .eq("installation_id", installation_id) \
            .execute()

        supabase.table("repo_dashboard_snapshot") \
            .update({"active": False}) \
            .eq("installation_id", installation_id) \
            .execute()


# -------------------------------------------------
# Installation repository changes
# -------------------------------------------------
def handle_installation_repositories_event(payload: dict):
    action = payload.get("action")
    installation_id = payload["installation"]["id"]

    repos = (
        payload.get("repositories_added", [])
        if action == "added"
        else payload.get("repositories_removed", [])
    )

    supabase = get_db()

    for repo in repos:
        full_name = repo["full_name"]
        owner, repo_name = full_name.split("/", 1)

        if action == "removed":
            supabase.table("repo_dashboard_snapshot") \
                .update({"active": False}) \
                .eq("installation_id", installation_id) \
                .eq("repo_full_name", full_name) \
                .execute()

        elif action == "added":
            # async ingest
            ingest_repo_task.delay(
                installation_id=installation_id,
                owner=owner,
                repo_name=repo_name,
                user_id=None,
            )

def handle_push_event(payload: dict):
    installation_id = payload["installation"]["id"]
    repo = payload["repository"]
    full_name = repo["full_name"]

    owner, repo_name = full_name.split("/", 1)

    # async → do NOT block webhook
    ingest_push_task.delay(
        installation_id=installation_id,
        owner=owner,
        repo_name=repo_name,
        payload=payload,
    )

def handle_pull_request_event(payload: dict):
    installation_id = payload["installation"]["id"]
    repo = payload["repository"]

    ingest_pull_request_task.delay(
        installation_id=installation_id,
        owner=repo["owner"]["login"],
        repo_name=repo["name"],
        payload=payload,
    )

def handle_issues_event(payload: dict):
    installation_id = payload["installation"]["id"]
    repo = payload["repository"]

    ingest_issue_task.delay(
        installation_id=installation_id,
        owner=repo["owner"]["login"],
        repo_name=repo["name"],
        payload=payload,
    )