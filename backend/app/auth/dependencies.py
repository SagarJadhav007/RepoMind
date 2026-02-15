from fastapi import Depends, HTTPException, Query
from app.auth.supabase import get_current_user
from app.models.roles import RoleType
from app.services.role_service import get_user_role_in_repo


def require_repo_admin(
    repo: str = Query(..., description="Repository full name (owner/repo)"),
    user=Depends(get_current_user),
):
    """Dependency to require admin role in a repository"""
    role = get_user_role_in_repo(user["id"], repo)
    
    if role != RoleType.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only repository admins can perform this action"
        )
    
    return user


def require_repo_maintainer(
    repo: str = Query(..., description="Repository full name (owner/repo)"),
    user=Depends(get_current_user),
):
    """Dependency to require maintainer or admin role in a repository"""
    role = get_user_role_in_repo(user["id"], repo)
    
    if role not in [RoleType.ADMIN, RoleType.MAINTAINER]:
        raise HTTPException(
            status_code=403,
            detail="Only maintainers and admins can perform this action"
        )
    
    return user


def require_repo_access(
    repo: str = Query(..., description="Repository full name (owner/repo)"),
    user=Depends(get_current_user),
):
    """Dependency to require any access to a repository"""
    role = get_user_role_in_repo(user["id"], repo)
    
    if not role:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this repository"
        )
    
    return user
