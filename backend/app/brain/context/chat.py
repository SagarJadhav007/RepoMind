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
""".strip()
        )

    return {
        "instruction": (
            "You are a GitHub repository assistant.\n\n"
            f"USER QUESTION:\n{message}\n\n"
            "Rules:\n"
            "- Answer ONLY what the user asked\n"
            "- If the provided code does not contain the answer, say so clearly\n"
            "- Use markdown for readability\n"
            "- Include sources with file names and line ranges\n"
            "- Do NOT guess or infer beyond the code\n"
            "- Return JSON only in the specified schema\n"
        ),
        "context": "\n\n".join(context_blocks),
    }
