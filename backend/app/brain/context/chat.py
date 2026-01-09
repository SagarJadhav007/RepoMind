from app.brain.context.base import retrieve_repo_embeddings, assemble_context


def build_chat_context(req):
    message = req.payload["message"]

    repo_context = retrieve_repo_embeddings(
        repo_full_name=req.repo_full_name,
        query=message,
        limit=8,
    )

    context = assemble_context({
        "user_question": message,
        "repo_context": repo_context,
        "rules": (
            "Use only the provided repo context.\n"
            "Mention file paths when relevant.\n"
            "If unsure, say you are unsure."
        )
    })

    return {
        "instruction": (
            "You are a helpful repository assistant helping contributors "
            "understand the codebase."
        ),
        "context": context,
    }
