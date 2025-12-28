from fastapi import APIRouter, Query
from app.services.dashboard_service import get_dashboard

router = APIRouter(prefix="/dashboard")

@router.get("/")
def get_repo_data(repo: str):
    data = get_dashboard(repo)
    if not data:
        raise HTTPException(404, "Snapshot not found")
    return data
