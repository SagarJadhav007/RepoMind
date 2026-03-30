from .task import TaskType
from .context.pr_review import build_pr_review_context
# from .context.issue import build_issue_context
from .context.chat import build_chat_context

async def route_task(req):
    if req.task_type == TaskType.PR_REVIEW:
        return await build_pr_review_context(req)

    if req.task_type == TaskType.ISSUE_TAGGING:
        return await build_issue_context(req)

    if req.task_type == TaskType.CHAT:
        return await build_chat_context(req)

    raise ValueError("Unsupported task")
