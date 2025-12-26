from fastapi import APIRouter, Request

router = APIRouter(prefix="/github")

@router.get("/callback")
def github_callback(installation_id: int):
    return {
        "message": "GitHub App installed",
        "installation_id": installation_id
    }

@router.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    print("Webhook received:", payload.get("action"))
    return {"status": "received"}
