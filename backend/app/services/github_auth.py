import jwt
import time
import os
import requests
import base64
import hmac
import hashlib
from fastapi import HTTPException
from dotenv import load_dotenv
load_dotenv()

GITHUB_API = "https://api.github.com"
GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY_B64 = os.getenv("GITHUB_PRIVATE_KEY_B64")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

if not GITHUB_WEBHOOK_SECRET:
    raise RuntimeError("GITHUB_WEBHOOK_SECRET not set")

GITHUB_WEBHOOK_SECRET = GITHUB_WEBHOOK_SECRET.encode()

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

def verify_github_signature(signature_header: str, body: bytes):
    if not signature_header:
        raise HTTPException(401, "Missing signature")

    try:
        sha_name, signature = signature_header.split("=", 1)
    except ValueError:
        raise HTTPException(401, "Malformed signature")

    if sha_name != "sha256":
        raise HTTPException(401, "Invalid signature type")

    mac = hmac.new(GITHUB_WEBHOOK_SECRET, body, hashlib.sha256)

    if not hmac.compare_digest(mac.hexdigest(), signature):
        raise HTTPException(401, "Invalid signature")
