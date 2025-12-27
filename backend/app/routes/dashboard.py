from fastapi import APIRouter, Query
from app.services.dashboard_service import get_dashboard

router = APIRouter(prefix="/dashboard")

@router.get("/all")
def dashboard_all(
    installation_id: int = Query(...),
    repo: str = Query(...)
):
    return get_dashboard(installation_id, repo)
