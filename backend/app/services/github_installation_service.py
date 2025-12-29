from fastapi import HTTPException
from app.db import get_db

def get_installation_id_for_user(user_id: str) -> int:
    supabase = get_db()

    res = (
        supabase
        .table("github_installations")
        .select("installation_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=400,
            detail="No GitHub installation linked for this user"
        )

    return res.data[0]["installation_id"]
