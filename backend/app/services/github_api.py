import requests

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
