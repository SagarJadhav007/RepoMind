from .base import retrieve_repo_embeddings, assemble_context

async def build_pr_review_context(req):
    diff = req.payload["diff"]

    related_chunks = await retrieve_repo_embeddings(
        req.repo_full_name,
        diff
    )

    context = assemble_context({
        "pr_diff": diff,
        "related_code": related_chunks,
    })

    # later → send to LLM
    return {
        "context": context,
        "instruction": "Review PR for bugs, performance, security"
    }
