from enum import Enum

class TaskType(str, Enum):
    CHAT = "chat"
    PR_REVIEW = "pr_review"
    ISSUE_TRIAGE = "issue_triage"
