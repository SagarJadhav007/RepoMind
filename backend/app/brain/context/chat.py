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

    context_blocks = []
    sources = []

    for m in matches:
        context_blocks.append(
            f"File: {m['path']}\n{m['content']}"
        )
        sources.append(m["path"])

    return {
        "instruction": (
            "You are an AI assistant helping users understand a GitHub repository.\n"
            "Answer clearly and concisely.\n"
            "When referring to code, mention the file name."
        ),
        "context": "\n\n---\n\n".join(context_blocks),
        "sources": sorted(set(sources)),
    }
