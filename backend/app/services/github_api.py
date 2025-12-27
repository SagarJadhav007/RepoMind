import requests
from datetime import datetime, timedelta

BASE_URL = "https://api.github.com"

def _headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }


def get_repo(token, owner, repo):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}",
        headers=_headers(token)
    )
    r.raise_for_status()
    return r.json()


def get_open_issues(token, owner, repo):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/issues?state=open",
        headers=_headers(token)
    )
    r.raise_for_status()
    return [i for i in r.json() if "pull_request" not in i]


def get_open_prs(token, owner, repo):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls?state=open",
        headers=_headers(token)
    )
    r.raise_for_status()
    return r.json()


def get_closed_prs(token, owner, repo):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls?state=closed",
        headers=_headers(token)
    )
    r.raise_for_status()
    return r.json()


def get_commits_30d(token, owner, repo):
    since = (datetime.utcnow() - timedelta(days=30)).isoformat() + "Z"
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/commits?since={since}",
        headers=_headers(token)
    )
    r.raise_for_status()
    return r.json()

def fetch_repositories(installation_token: str):
    headers = {
        "Authorization": f"Bearer {installation_token}",  # ✅ FIX
        "Accept": "application/vnd.github+json"
    }

    res = requests.get(
        "https://api.github.com/installation/repositories",
        headers=headers
    )

    res.raise_for_status()
    return res.json()["repositories"]

