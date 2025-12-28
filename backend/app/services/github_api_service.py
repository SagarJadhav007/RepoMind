import requests
from datetime import datetime, timedelta
from app.db import get_db
from app.services.health_metrics import health_score, pr_merge_rate

BASE_URL = "https://api.github.com"


# -------------------- Helpers -------------------- #

def _headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }


def github_paginated_get(url: str, token: str, params: dict | None = None):
    """
    Generic GitHub pagination handler.
    Fetches all pages using per_page=100.
    """
    results = []
    page = 1
    params = params or {}

    while True:
        r = requests.get(
            url,
            headers=_headers(token),
            params={**params, "per_page": 100, "page": page}
        )
        r.raise_for_status()

        data = r.json()
        if not data:
            break

        results.extend(data)
        page += 1

    return results


# ---------------- GitHub API Calls ---------------- #

def get_repo(token: str, owner: str, repo: str):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}",
        headers=_headers(token)
    )
    r.raise_for_status()
    return r.json()


def get_open_issues(token: str, owner: str, repo: str):
    issues = github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/issues",
        token,
        params={"state": "open"}
    )
    # filter out PRs
    return [i for i in issues if "pull_request" not in i]


def get_open_prs(token: str, owner: str, repo: str):
    return github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        token,
        params={"state": "open"}
    )


def get_closed_prs(token: str, owner: str, repo: str):
    return github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        token,
        params={"state": "closed"}
    )


def get_commits_30d(token: str, owner: str, repo: str):
    since = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"

    return github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/commits",
        token,
        params={"since": since}
    )


def fetch_repositories(installation_token: str):
    r = requests.get(
        f"{BASE_URL}/installation/repositories",
        headers=_headers(installation_token)
    )
    r.raise_for_status()
    return r.json()["repositories"]


# ---------------- Ingest Logic ---------------- #

def ingest_repo_snapshot(token, installation_id, owner, repo_name):
    repo_data = get_repo(token, owner, repo_name)
    issues = get_open_issues(token, owner, repo_name)
    open_prs = get_open_prs(token, owner, repo_name)
    closed_prs = get_closed_prs(token, owner, repo_name)
    commits = get_commits_30d(token, owner, repo_name)

    contributors = len({
        c["author"]["login"]
        for c in commits if c.get("author")
    })

    merge_rate = pr_merge_rate(closed_prs) if closed_prs else None
    health = health_score(
        len(open_prs),
        len(issues),
        len(commits),
        contributors
    )

    supabase = get_db()

    payload = {
        "repo_full_name": repo_data["full_name"],
        "installation_id": installation_id,
        "description": repo_data["description"],
        "stars": repo_data["stargazers_count"],
        "forks": repo_data["forks_count"],
        "watchers": repo_data["subscribers_count"],
        "open_prs": len(open_prs),
        "open_issues": len(issues),
        "commits_30d": len(commits),
        "contributors": contributors,
        "merge_rate": merge_rate,
        "health_score": health,
    }

    supabase.table("repo_dashboard_snapshot") \
        .upsert(payload, on_conflict="repo_full_name") \
        .execute()

    return {
        "message": "Snapshot ingested",
        "repo": repo_data["full_name"]
    }

# Manager Console Api
def get_manager_open_prs(token: str, owner: str, repo: str):
    prs = get_open_prs(token, owner, repo)

    return [
        {
            "id": pr["number"],
            "title": pr["title"],
            "author": pr["user"]["login"],
            "created_at": pr["created_at"],
            "updated_at": pr["updated_at"],
            "draft": pr["draft"],
            "labels": [l["name"] for l in pr["labels"]],
            "comments": pr["comments"],
            "review_comments": pr["review_comments"],
            "url": pr["html_url"],
        }
        for pr in prs
    ]


def get_manager_open_issues(token: str, owner: str, repo: str):
    issues = get_open_issues(token, owner, repo)

    return [
        {
            "id": issue["number"],
            "title": issue["title"],
            "author": issue["user"]["login"],
            "created_at": issue["created_at"],
            "comments": issue["comments"],
            "labels": [l["name"] for l in issue["labels"]],
            "url": issue["html_url"],
        }
        for issue in issues
    ]
