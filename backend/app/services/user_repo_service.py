from app.db import get_db

def get_active_repo(user_id: str):
    supabase = get_db()

    res = (
        supabase
        .table("user_repos")
        .select("repo_full_name, installation_id")
        .eq("user_id", user_id)
        .eq("active", True)
        .single()
        .execute()
    )

    return res.data if res.data else None
