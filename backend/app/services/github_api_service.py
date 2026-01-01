import requests
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.db import get_db
from app.services.health_metrics import health_score, pr_merge_rate

BASE_URL = "https://api.github.com"


# -------------------------------------------------
# Helpers
# -------------------------------------------------
def _headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }


def github_safe_get(url: str, token: str, params: dict | None = None):
    try:
        r = requests.get(
            url,
            headers=_headers(token),
            params=params or {},
            timeout=10,
        )

        if r.status_code in (404, 409, 422):
            return []

        r.raise_for_status()
        return r.json()

    except requests.RequestException:
        return []


def github_paginated_get(url: str, token: str, params: dict | None = None):
    results = []
    page = 1
    params = params or {}

    while True:
        data = github_safe_get(
            url,
            token,
            {**params, "per_page": 100, "page": page},
        )

        if not data:
            break

        results.extend(data)
        page += 1

    return results


# -------------------------------------------------
# GitHub API
# -------------------------------------------------
def get_repo(token: str, owner: str, repo: str):
    data = github_safe_get(
        f"{BASE_URL}/repos/{owner}/{repo}",
        token,
    )

    if not data:
        raise HTTPException(404, "Repository not accessible")

    return data


def get_open_issues(token: str, owner: str, repo: str):
    return [
        i
        for i in github_paginated_get(
            f"{BASE_URL}/repos/{owner}/{repo}/issues",
            token,
            {"state": "open"},
        )
        if "pull_request" not in i
    ]


def get_open_prs(token: str, owner: str, repo: str):
    return github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        token,
        {"state": "open"},
    )


def get_closed_prs(token: str, owner: str, repo: str):
    return github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        token,
        {"state": "closed"},
    )


def get_commits_30d(token: str, owner: str, repo: str):
    since = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"

    return github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/commits",
        token,
        {"since": since},
    )


def fetch_repositories(installation_token: str):
    data = github_safe_get(
        f"{BASE_URL}/installation/repositories",
        installation_token,
    )
    return data.get("repositories", []) if isinstance(data, dict) else []


# -------------------------------------------------
# Contributor Scoring Logic
# -------------------------------------------------
def compute_contributor_type(commits, prs_merged):
    if commits >= 50 or prs_merged >= 20:
        return "core"
    if commits >= 10:
        return "regular"
    if commits > 0:
        return "first-time"
    return "inactive"


def compute_contributor_score(commits, prs, issues):
    return min(100, commits + prs * 3 + issues * 2)


# -------------------------------------------------
# Contributor Ingestion
# -------------------------------------------------
def ingest_repo_contributors(token: str, owner: str, repo: str):
    supabase = get_db()
    repo_full_name = f"{owner}/{repo}"

    commits = github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/commits",
        token,
    )

    prs = github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        token,
        {"state": "closed"},
    )

    issues = github_paginated_get(
        f"{BASE_URL}/repos/{owner}/{repo}/issues",
        token,
        {"state": "closed"},
    )

    contributors = {}

    # ---- COMMITS ----
    for c in commits:
        if not c.get("author"):
            continue

        u = c["author"]
        uid = u["id"]

        contributors.setdefault(uid, {
            "github_user_id": uid,
            "username": u["login"],
            "name": u.get("login"),
            "avatar_url": u["avatar_url"],
            "commits": 0,
            "prs_merged": 0,
            "issues_closed": 0,
            "first_contribution_at": c["commit"]["author"]["date"],
            "last_activity_at": c["commit"]["author"]["date"],
        })

        contributors[uid]["commits"] += 1
        contributors[uid]["last_activity_at"] = c["commit"]["author"]["date"]

    # ---- PRs ----
    for pr in prs:
        if not pr.get("user") or not pr.get("merged_at"):
            continue

        uid = pr["user"]["id"]
        if uid in contributors:
            contributors[uid]["prs_merged"] += 1
            contributors[uid]["last_activity_at"] = pr["merged_at"]

    # ---- ISSUES ----
    for issue in issues:
        if "pull_request" in issue or not issue.get("user"):
            continue

        uid = issue["user"]["id"]
        if uid in contributors:
            contributors[uid]["issues_closed"] += 1
            contributors[uid]["last_activity_at"] = issue["closed_at"]

    rows = []
    for c in contributors.values():
        rows.append({
            "repo_full_name": repo_full_name,
            **c,
            "type": compute_contributor_type(c["commits"], c["prs_merged"]),
            "score": compute_contributor_score(
                c["commits"],
                c["prs_merged"],
                c["issues_closed"],
            ),
            "updated_at": datetime.utcnow(),
        })

    if rows:
        supabase.table("repo_contributors") \
            .upsert(rows, on_conflict="repo_full_name,github_user_id") \
            .execute()

    return {"contributors_ingested": len(rows)}


# -------------------------------------------------
# Repo Dashboard Snapshot (SAFE FOR ALL REPOS)
# -------------------------------------------------
def ingest_repo_snapshot(
    token: str,
    installation_id: int,
    owner: str,
    repo_name: str,
    user_id: str,
):
    repo_data = get_repo(token, owner, repo_name)

    issues = get_open_issues(token, owner, repo_name)
    open_prs = get_open_prs(token, owner, repo_name)
    closed_prs = get_closed_prs(token, owner, repo_name)
    commits = get_commits_30d(token, owner, repo_name)

    contributors_count = len({
        c["author"]["login"]
        for c in commits if c.get("author")
    })

    merge_rate = pr_merge_rate(closed_prs) if closed_prs else 0

    health = health_score(
        open_prs=len(open_prs),
        open_issues=len(issues),
        commits=len(commits),
        contributors=contributors_count,
    )

    payload = {
        "repo_full_name": repo_data["full_name"],
        "installation_id": installation_id,
        "user_id": user_id,
        "description": repo_data.get("description"),
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "watchers": repo_data.get("subscribers_count", 0),
        "open_prs": len(open_prs),
        "open_issues": len(issues),
        "commits_30d": len(commits),
        "contributors": contributors_count,
        "merge_rate": merge_rate,
        "health_score": health,
        "updated_at": datetime.utcnow(),
    }

    supabase = get_db()
    supabase.table("repo_dashboard_snapshot") \
        .upsert(payload, on_conflict="repo_full_name") \
        .execute()

    # 🔥 IMPORTANT: ingest contributors AFTER snapshot
    ingest_repo_contributors(token, owner, repo_name)

    return {
        "status": "ok",
        "repo": repo_data["full_name"],
    }


# -------------------------------------------------
# Manager Console APIs
# -------------------------------------------------
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
