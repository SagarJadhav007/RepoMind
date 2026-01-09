from enum import Enum

class TaskType(str, Enum):
    PR_REVIEW = "pr_review"
    ISSUE_TAGGING = "issue_tagging"
    TASK_ASSIGNMENT = "task_assignment"
    CHAT = "chat"
