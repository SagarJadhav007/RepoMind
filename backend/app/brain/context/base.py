from app.db import get_db
from app.brain.llm.gemini import GeminiLLM

llm = GeminiLLM()


def retrieve_repo_embeddings(
    repo_full_name: str,
    query: str,
    limit: int = 8,
) -> str:
    db = get_db()
    query_embedding = llm.embed(query)

    rows = (
        db.table("repo_embeddings")
        .select("path, content")
        .eq("repo_full_name", repo_full_name)
        .order("embedding <-> :embedding", desc=False)
        .limit(limit)
        .execute({"embedding": query_embedding})
    )

    chunks = []
    for r in rows.data or []:
        chunks.append(f"{r['path']}\n{r['content']}")

    return "\n\n".join(chunks)


def assemble_context(sections: dict) -> str:
    parts = []
    for title, content in sections.items():
        parts.append(f"[{title.upper()}]\n{content}")
    return "\n\n".join(parts)
