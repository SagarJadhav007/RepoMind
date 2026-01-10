from app.brain.context.base import retrieve_repo_embeddings
from app.brain.embedding import embed_text

async def build_chat_context(req):
    message = req.payload["message"]

    query_embedding = embed_text(message)

    matches = retrieve_repo_embeddings(
        repo_full_name=req.repo_full_name,
        query_embedding=query_embedding,
        limit=6,
    )

    context_blocks = []
    for m in matches:
        context_blocks.append(
            f"""
FILE: {m['path']}
LINES: {m.get('start_line', '?')}–{m.get('end_line', '?')}
CODE:
{m['content']}
"""
        )

    return {
        "instruction": (
            "You are a GitHub repository assistant.\n"
            "Answer clearly using markdown.\n"
            "Always include sources with file names and line ranges.\n"
            "Return JSON only."
        ),
        "context": "\n\n".join(context_blocks),
    }
