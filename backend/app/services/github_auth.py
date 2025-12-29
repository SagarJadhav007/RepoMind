import jwt
import time
import os
import requests
import base64

GITHUB_API = "https://api.github.com"
GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY_B64 = os.getenv("GITHUB_PRIVATE_KEY_B64")

def generate_github_app_jwt():
    now = int(time.time())

    private_key = base64.b64decode(
        GITHUB_PRIVATE_KEY_B64
    ).decode("utf-8")

    payload = {
        "iat": now - 60,
        "exp": now + 600,
        "iss": GITHUB_APP_ID
    }

    return jwt.encode(
        payload,
        private_key,
        algorithm="RS256"
    )


def get_installation_access_token(installation_id: int) -> str:
    jwt_token = generate_github_app_jwt()

    url = f"{GITHUB_API}/app/installations/{installation_id}/access_tokens"

    headers = {
        "Authorization": f"Bearer {jwt_token}",  
        "Accept": "application/vnd.github+json"
    }

    response = requests.post(url, headers=headers)
    response.raise_for_status()

    return response.json()["token"]
