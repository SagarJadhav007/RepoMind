from fastapi import APIRouter, Request
from app.services.github_auth import get_installation_access_token
from app.services.github_api import fetch_repositories

router = APIRouter(prefix="/github")

@router.get("/callback")
def github_callback(
    installation_id: int,
    setup_action: str | None = None
):
    try:
        token = get_installation_access_token(installation_id)
        repos = fetch_repositories(token)

        return {
            "message": "Installation successful",
            "installation_id": installation_id,
            "repo_count": len(repos),
            "repos": [r["full_name"] for r in repos]
        }

    except Exception as e:
        # NEVER crash callbacks
        return {
            "error": str(e),
            "installation_id": installation_id,
            "setup_action": setup_action
        }


@router.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    print("Webhook received:", payload.get("action"))
    return {"status": "received"}
