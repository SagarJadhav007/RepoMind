from fastapi import HTTPException
from app.db import get_db
from app.models.roles import RoleType


def get_user_role_in_repo(user_id: str, repo_full_name: str) -> RoleType | None:
    """
    Get the role of a user in a specific repository.
    Returns None if user is not a member of the repo.
    """
    supabase = get_db()
    
    try:
        result = (
            supabase.table("repo_members")
            .select("role")
            .eq("user_id", user_id)
            .eq("repo_full_name", repo_full_name)
            .single()
            .execute()
        )
        
        if result.data:
            return RoleType(result.data["role"])
        return None
    except Exception:
        return None


def is_repo_admin(user_id: str, repo_full_name: str) -> bool:
    """Check if user is admin of the repository"""
    role = get_user_role_in_repo(user_id, repo_full_name)
    return role == RoleType.ADMIN


def is_repo_maintainer_or_above(user_id: str, repo_full_name: str) -> bool:
    """Check if user is maintainer or admin of the repository"""
    role = get_user_role_in_repo(user_id, repo_full_name)
    return role in [RoleType.ADMIN, RoleType.MAINTAINER]


def is_repo_contributor_or_above(user_id: str, repo_full_name: str) -> bool:
    """Check if user is contributor or above in the repository"""
    role = get_user_role_in_repo(user_id, repo_full_name)
    return role in [RoleType.ADMIN, RoleType.MAINTAINER, RoleType.CONTRIBUTOR]


def require_repo_role(required_role: RoleType):
    """
    Dependency factory for role-based authorization in routes
    Usage: def my_route(..., repo_access=Depends(require_repo_role(RoleType.ADMIN))):
    """
    def check_role(user_id: str, repo_full_name: str):
        user_role = get_user_role_in_repo(user_id, repo_full_name)
        
        if not user_role:
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this repository"
            )
        
        # Role hierarchy: ADMIN > MAINTAINER > CONTRIBUTOR
        role_hierarchy = {
            RoleType.ADMIN: 3,
            RoleType.MAINTAINER: 2,
            RoleType.CONTRIBUTOR: 1,
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=f"Requires {required_role} role or above"
            )
        
        return user_role
    
    return check_role


def get_repo_members(repo_full_name: str, page: int = 1, limit: int = 20):
    """Get all members of a repository"""
    supabase = get_db()
    offset = (page - 1) * limit
    
    result = (
        supabase.table("repo_members")
        .select("*")
        .eq("repo_full_name", repo_full_name)
        .order("role", desc=False)
        .range(offset, offset + limit - 1)
        .execute()
    )
    
    total = (
        supabase.table("repo_members")
        .select("id", count="exact")
        .eq("repo_full_name", repo_full_name)
        .execute()
        .count
    )
    
    return {
        "members": result.data,
        "total": total,
        "page": page,
        "limit": limit,
    }


def add_repo_member(
    repo_full_name: str,
    user_id: str,
    github_username: str,
    role: RoleType,
    added_by: str,
):
    """Add a member to a repository"""
    supabase = get_db()
    
    # Check if member already exists
    existing = (
        supabase.table("repo_members")
        .select("id")
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user_id)
        .execute()
    )
    
    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this repository"
        )
    
    result = (
        supabase.table("repo_members")
        .insert({
            "repo_full_name": repo_full_name,
            "user_id": user_id,
            "github_username": github_username,
            "role": role.value,
            "added_by": added_by,
        })
        .execute()
    )
    
    return result.data[0] if result.data else None


def update_member_role(
    repo_full_name: str,
    user_id: str,
    new_role: RoleType,
):
    """Update a member's role in a repository"""
    supabase = get_db()
    
    result = (
        supabase.table("repo_members")
        .update({"role": new_role.value})
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Member not found in this repository"
        )
    
    return result.data[0]


def remove_repo_member(repo_full_name: str, user_id: str):
    """Remove a member from a repository"""
    supabase = get_db()
    
    result = (
        supabase.table("repo_members")
        .delete()
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Member not found in this repository"
        )
