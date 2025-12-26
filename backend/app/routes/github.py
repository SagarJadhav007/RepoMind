from fastapi import APIRouter
from app.services.github_auth import get_installation_access_token
from app.services.github_api import fetch_repositories

router = APIRouter(prefix="/github")

@router.get("/callback")
def github_callback(installation_id: int):
    token = get_installation_access_token(installation_id)
    repos = fetch_repositories(token)

    return {
        "message": "JWT + installation token working",
        "installation_id": installation_id,
        "token_preview": token[:10] + "...",
        "repo_count": len(repos),
        "repos": [r["full_name"] for r in repos]
    }

@router.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    print("Webhook received:", payload.get("action"))
    return {"status": "received"}
