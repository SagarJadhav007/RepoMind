from enum import Enum
from pydantic import BaseModel
from datetime import datetime


class RoleType(str, Enum):
    """Role types in a repository"""
    ADMIN = "admin"
    MAINTAINER = "maintainer"
    CONTRIBUTOR = "contributor"


class RepoMember(BaseModel):
    """Repository member with role"""
    id: str | None = None
    repo_full_name: str
    user_id: str
    github_username: str | None = None
    role: RoleType
    added_by: str
    added_at: datetime | None = None
    updated_at: datetime | None = None


class RepoMemberResponse(BaseModel):
    """Response model for repository member"""
    id: str
    repo_full_name: str
    user_id: str
    github_username: str | None
    role: RoleType
    added_at: datetime
    updated_at: datetime


class AddMemberRequest(BaseModel):
    """Request to add a member to a repository"""
    github_username: str
    role: RoleType = RoleType.CONTRIBUTOR


class UpdateMemberRoleRequest(BaseModel):
    """Request to update a member's role"""
    role: RoleType


class RemoveMemberRequest(BaseModel):
    """Request to remove a member from a repository"""
    user_id: str
