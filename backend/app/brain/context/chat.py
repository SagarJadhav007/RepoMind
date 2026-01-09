from app.brain.context.base import retrieve_repo_embeddings
from app.brain.embedding import embed_text

async def build_chat_context(req):
    message = req.payload["message"]

    query_embedding = embed_text(message)

    matches = retrieve_repo_embeddings(
        repo_full_name=req.repo_full_name,
        query_embedding=query_embedding,
        limit=8,
    )

    context = "\n\n".join(
        f"[{m['path']}]\n{m['content']}"
        for m in matches
    )

    return {
        "instruction": "You are an AI assistant helping users understand a GitHub repository.",
        "context": context,
    }
