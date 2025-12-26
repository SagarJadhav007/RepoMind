import jwt
import time
import os
import requests

GITHUB_API = "https://api.github.com"
GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY = os.getenv("GITHUB_PRIVATE_KEY")

def generate_github_app_jwt() -> str:
    now = int(time.time())

    payload = {
        "iat": now - 60,          
        "exp": now + 600,         
        "iss": GITHUB_APP_ID      
    }

    token = jwt.encode(
        payload,
        GITHUB_PRIVATE_KEY,
        algorithm="RS256"
    )

    return token


def get_installation_access_token(installation_id: int) -> str:
    jwt_token = generate_github_app_jwt()

    url = f"{GITHUB_API}/app/installations/{installation_id}/access_tokens"

    headers = {
        "Authorization": f"Bearer {jwt_token}",  # MUST be Bearer
        "Accept": "application/vnd.github+json"
    }

    response = requests.post(url, headers=headers)
    response.raise_for_status()

    return response.json()["token"]
