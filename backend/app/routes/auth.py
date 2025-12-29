from fastapi import APIRouter
from fastapi.responses import RedirectResponse
import requests
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID")
CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET")

@router.get("/github/login")
def github_login():
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={CLIENT_ID}"
        "&scope=read:user user:email"
    )
    return RedirectResponse(url)

@router.get("/github/callback")
def github_callback(code: str):
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
        },
    )
    token_res.raise_for_status()

    access_token = token_res.json()["access_token"]

    user_res = requests.get(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        },
    )
    user_res.raise_for_status()

    user = user_res.json()

    return {
        "github_id": user["id"],
        "username": user["login"],
        "avatar": user["avatar_url"],
    }
