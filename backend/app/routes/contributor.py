from fastapi import APIRouter, Depends, Query, HTTPException, Body
from app.db import get_db
from app.auth.supabase import get_current_user
from app.auth.dependencies import require_repo_admin
from app.models.roles import RoleType, AddMemberRequest, UpdateMemberRoleRequest, RemoveMemberRequest
from app.services.role_service import (
    get_repo_members,
    add_repo_member,
    update_member_role,
    remove_repo_member,
    get_user_role_in_repo,
)

router = APIRouter(prefix="/contributors", tags=["Contributors"])


@router.get("")
def get_contributors(
    repo: str = Query(...),  # full repo name
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=50),
    user=Depends(get_current_user),
):
    supabase = get_db()
    offset = (page - 1) * limit

    # verify repo belongs to user or user has access
    role = get_user_role_in_repo(user["id"], repo)
    if not role:
        raise HTTPException(403, "Repo not accessible")

    total = (
        supabase.table("repo_contributors")
        .select("id", count="exact")
        .eq("repo_full_name", repo)
        .execute()
        .count
    )

    contributors = (
        supabase.table("repo_contributors")
        .select("*")
        .eq("repo_full_name", repo)
        .order("score", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return {
        "repo": repo,
        "page": page,
        "limit": limit,
        "total": total,
        "contributors": contributors.data,
    }


# -------------------------------------------------
# Repository Members Management
# -------------------------------------------------
@router.get("/members")
def get_members(
    repo: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    user=Depends(get_current_user),
):
    """Get all members of a repository. Requires access to the repo."""
    role = get_user_role_in_repo(user["id"], repo)
    if not role:
        raise HTTPException(403, "You don't have access to this repository")
    
    result = get_repo_members(repo, page, limit)
    return result


@router.post("/members")
def add_member(
    repo: str = Query(...),
    request: AddMemberRequest = Body(...),
    user=Depends(require_repo_admin),
):
    """Add a member to a repository. Requires admin role."""
    supabase = get_db()
    
    # Get GitHub user ID from username
    from app.services.github_auth import get_installation_access_token
    from app.services.github_api_service import github_safe_get, BASE_URL
    
    repo_data = supabase.table("repo_dashboard_snapshot") \
        .select("installation_id") \
        .eq("repo_full_name", repo) \
        .single() \
        .execute()
    
    if not repo_data.data:
        raise HTTPException(404, "Repository not found")
    
    try:
        token = get_installation_access_token(repo_data.data["installation_id"])
        github_user = github_safe_get(f"{BASE_URL}/users/{request.github_username}", token)
        
        if not github_user or "id" not in github_user:
            raise HTTPException(404, f"GitHub user '{request.github_username}' not found")
        
        member = add_repo_member(
            repo_full_name=repo,
            user_id=github_user["id"],
            github_username=request.github_username,
            role=request.role,
            added_by=user["id"],
        )
        
        return {
            "status": "ok",
            "member": member,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Failed to add member: {str(e)}")


@router.put("/members/{user_id}")
def update_member(
    repo: str = Query(...),
    user_id: str = None,
    request: UpdateMemberRoleRequest = Body(...),
    admin_user=Depends(require_repo_admin),
):
    """Update a member's role. Requires admin role."""
    if not user_id:
        raise HTTPException(400, "user_id is required")
    
    member = update_member_role(repo, user_id, request.role)
    return {
        "status": "ok",
        "member": member,
    }


@router.delete("/members/{user_id}")
def remove_member(
    repo: str = Query(...),
    user_id: str = None,
    admin_user=Depends(require_repo_admin),
):
    """Remove a member from a repository. Requires admin role."""
    if not user_id:
        raise HTTPException(400, "user_id is required")
    
    remove_repo_member(repo, user_id)
    return {
        "status": "ok",
        "message": "Member removed successfully",
    }

