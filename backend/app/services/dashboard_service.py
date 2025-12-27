from app.services.github_auth import get_installation_access_token
from app.services.github_api import (
    get_repo,
    get_open_issues,
    get_open_prs,
    get_closed_prs,
    get_commits_30d
)
from app.services.health_metrics import health_score, pr_merge_rate
from app.db import get_db

USE_DB = False

def build_dashboard_snapshot(installation_id: int, repo: str):
    owner, repo_name = repo.split("/")
    token = get_installation_access_token(installation_id)

    repo_data = get_repo(token, owner, repo_name)
    issues = get_open_issues(token, owner, repo_name)
    open_prs = get_open_prs(token, owner, repo_name)
    closed_prs = get_closed_prs(token, owner, repo_name)
    commits = get_commits_30d(token, owner, repo_name)

    contributors = len(
        {c["author"]["login"] for c in commits if c.get("author")}
    )

    return {
        "repo": {
            "full_name": repo_data["full_name"],
            "description": repo_data["description"],
            "stars": repo_data["stargazers_count"],
            "forks": repo_data["forks_count"],
            "watchers": repo_data["subscribers_count"],
        },
        "status": {
            "open_prs": len(open_prs),
            "open_issues": len(issues),
        },
        "activity": {
            "commits_30d": len(commits),
            "contributors": contributors,
            "merge_rate": pr_merge_rate(closed_prs),
        },
        "health": {
            "score": health_score(
                len(open_prs),
                len(issues),
                len(commits),
                contributors
            )
        }
    }


def get_dashboard(installation_id: int, repo: str):
    # 🔹 If DB disabled, just fetch live data
    if not USE_DB:
        return build_dashboard_snapshot(installation_id, repo)

    # 🔹 DB logic (only when USE_DB = True)
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM repo_dashboard_snapshot WHERE repo_full_name = %s",
        (repo,)
    )
    cached = cur.fetchone()

    if cached:
        cur.close()
        conn.close()
        return {
            "repo": cached["repo"],
            "status": cached["status"],
            "activity": cached["activity"],
            "health": cached["health"],
        }

    snapshot = build_dashboard_snapshot(installation_id, repo)

    cur.execute(
        """
        INSERT INTO repo_dashboard_snapshot
        (repo_full_name, installation_id, repo, status, activity, health)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (repo_full_name)
        DO UPDATE SET
          repo = EXCLUDED.repo,
          status = EXCLUDED.status,
          activity = EXCLUDED.activity,
          health = EXCLUDED.health,
          updated_at = now()
        """,
        (
            repo,
            installation_id,
            snapshot["repo"],
            snapshot["status"],
            snapshot["activity"],
            snapshot["health"],
        )
    )

    conn.commit()
    cur.close()
    conn.close()

    return snapshot

