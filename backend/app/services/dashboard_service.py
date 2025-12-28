from app.db import get_db

def get_dashboard(repo_full_name: str):
    supabase = get_db()

    res = (
        supabase
        .table("repo_dashboard_snapshot")
        .select("*")
        .eq("repo_full_name", repo_full_name)
        .single()
        .execute()
    )

    if not res.data:
        return None

    row = res.data

    return {
        "repo": {
            "full_name": row["repo_full_name"],
            "description": row["description"],
            "stars": row["stars"],
            "forks": row["forks"],
            "watchers": row["watchers"],
        },
        "status": {
            "open_prs": row["open_prs"],
            "open_issues": row["open_issues"],
        },
        "activity": {
            "commits_30d": row["commits_30d"],
            "contributors": row["contributors"],
            "merge_rate": row["merge_rate"],
        },
        "health": {
            "score": row["health_score"],
        },
    }
