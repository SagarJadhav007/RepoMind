from app.db import get_db
import re

def retrieve_repo_embeddings(
    repo_full_name: str,
    query_embedding: list[float],
    limit: int = 8,
    file_pattern: str | None = None,
    search_names: list[str] | None = None,
):
    """Enhanced retrieval with function-aware filtering"""
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

    # Filter by file pattern if specified
    if file_pattern:
        results = [
            r for r in results
            if re.search(file_pattern, r.get("path", ""))
        ]

    # Filter by function names if specified
    if search_names:
        filtered = []
        for r in results:
            content = r.get("content", "")
            if any(name.lower() in content.lower() for name in search_names):
                filtered.append(r)
        results = filtered if filtered else results  # Fallback

    # Normalize and return
    return [
        {
            "path": r.get("path"),
            "content": r.get("content"),
            "similarity": r.get("similarity", 0),
        }
        for r in results[:limit]
    ]
