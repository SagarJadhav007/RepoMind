from app.db import get_db

def retrieve_repo_embeddings(
    repo_full_name: str,
    query_embedding: list[float],
    limit: int = 8,
):
    supabase = get_db()

    result = (
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

    return result.data or []
