from app.db import get_db
from datetime import datetime

def handle_installation_event(payload: dict):
    action = payload.get("action")
    installation_id = payload["installation"]["id"]

    supabase = get_db()

    if action == "deleted":
        # Soft delete installation
        supabase.table("github_installations") \
            .update({"deleted_at": datetime.utcnow().isoformat()}) \
            .eq("installation_id", installation_id) \
            .execute()

    # created is handled by OAuth callback → ignore

def handle_installation_repositories_event(payload: dict):
    action = payload.get("action")
    installation_id = payload["installation"]["id"]

    repos = payload.get("repositories_added", []) \
        if action == "added" else payload.get("repositories_removed", [])

    supabase = get_db()

    for repo in repos:
        full_name = repo["full_name"]

        if action == "removed":
            supabase.table("repo_dashboard_snapshot") \
                .update({"active": False}) \
                .eq("installation_id", installation_id) \
                .eq("repo_full_name", full_name) \
                .execute()

        elif action == "added":
            # mark active again (or insert later via ingest)
            supabase.table("repo_dashboard_snapshot") \
                .update({"active": True}) \
                .eq("installation_id", installation_id) \
                .eq("repo_full_name", full_name) \
                .execute()
