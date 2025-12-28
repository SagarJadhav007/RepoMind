from app.db import get_db


def get_dashboard(repo_full_name: str):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            repo_full_name,
            description,
            stars,
            forks,
            watchers,
            open_prs,
            open_issues,
            commits_30d,
            contributors,
            merge_rate,
            health_score
        FROM repo_dashboard_snapshot
        WHERE repo_full_name = %s
        """,
        (repo_full_name,)
    )

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return None

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
