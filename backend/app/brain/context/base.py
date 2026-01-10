from app.db import get_db

def retrieve_repo_embeddings(
    repo_full_name: str,
    query_embedding: list[float],
    limit: int = 8,
):
    supabase = get_db()

    res = (
        supabase
        .rpc(
            "match_repo_embeddings",
            {
                "query_embedding": query_embedding,
                "repo": repo_full_name,
                "match_count": limit,
            },
        )
        .execute()
    )

    results = res.data or []

    # Normalize shape
    return [
        {
            "path": r.get("path"),
            "content": r.get("content"),
        }
        for r in results
    ]
