from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.supabase import get_current_user
from app.db import get_db
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid
import secrets
import os

router = APIRouter(prefix="/invite", tags=["Invite"])

# ==================== PYDANTIC MODELS ====================

class GenerateInviteRequest(BaseModel):
    repo_full_name: str
    role: str  # "contributor" or "maintainer"
    timezone: Optional[str] = None

class GenerateInviteResponse(BaseModel):
    code: str
    link: str
    expires_at: str
    role: str

class ValidateInviteResponse(BaseModel):
    valid: bool
    repo_full_name: str
    role: str
    inviter_name: str
    expires_at: str

class AcceptInviteRequest(BaseModel):
    code: str

# ==================== INVITE ENDPOINTS ====================

@router.post("/generate", response_model=GenerateInviteResponse)
def generate_invite(
    request: GenerateInviteRequest,
    user=Depends(get_current_user)
):
    """Generate a shareable invite link for a repository"""
    supabase = get_db()
    
    # Validate role
    if request.role not in ["contributor", "maintainer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Check if user has permission to invite (is admin/maintainer in repo)
    repo_member = (
        supabase
        .table("repo_members")
        .select("role")
        .eq("repo_full_name", request.repo_full_name)
        .eq("user_id", user["id"])
        .execute()
    )
    
    if not repo_member.data or repo_member.data[0]["role"] not in ["admin", "maintainer"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Generate unique code
    code = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Store invite in database
    invite_data = {
        "code": code,
        "repo_full_name": request.repo_full_name,
        "role": request.role,
        "created_by": user["id"],
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "used": False,
    }
    
    res = supabase.table("repo_invites").insert(invite_data).execute()
    
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create invite")
    
    # Generate full link
    frontend_url = os.getenv('FRONTEND_URL', 'https://repomind.dev')
    link = f"{frontend_url}/invite/{code}"
    
    return {
        "code": code,
        "link": link,
        "expires_at": expires_at.isoformat(),
        "role": request.role,
    }


@router.get("/validate", response_model=ValidateInviteResponse)
def validate_invite(code: str = Query(...)):
    """Validate an invite code and get invite details"""
    supabase = get_db()
    
    res = (
        supabase
        .table("repo_invites")
        .select("*")
        .eq("code", code)
        .single()
        .execute()
    )
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    invite = res.data
    
    # Check if invite is expired
    expires_at = datetime.fromisoformat(invite["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=410, detail="Invite expired")
    
    # Check if invite was already used
    if invite.get("used"):
        raise HTTPException(status_code=410, detail="Invite already used")
    
    # Get inviter info
    inviter_res = (
        supabase
        .table("user_profiles")
        .select("full_name")
        .eq("user_id", invite["created_by"])
        .single()
        .execute()
    )
    
    inviter_name = inviter_res.data.get("full_name", "Someone") if inviter_res.data else "Someone"
    
    return {
        "valid": True,
        "repo_full_name": invite["repo_full_name"],
        "role": invite["role"],
        "inviter_name": inviter_name,
        "expires_at": invite["expires_at"],
    }


@router.post("/accept")
def accept_invite(request: AcceptInviteRequest, user=Depends(get_current_user)):
    """Accept an invite and add user to repository"""
    supabase = get_db()
    
    # Validate invite
    invite_res = (
        supabase
        .table("repo_invites")
        .select("*")
        .eq("code", request.code)
        .single()
        .execute()
    )
    
    if not invite_res.data:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    invite = invite_res.data
    
    # Check if expired
    expires_at = datetime.fromisoformat(invite["expires_at"])
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=410, detail="Invite expired")
    
    # Check if already used
    if invite.get("used"):
        raise HTTPException(status_code=410, detail="Invite already used")
    
    # Check if user already a member
    existing_member = (
        supabase
        .table("repo_members")
        .select("id")
        .eq("repo_full_name", invite["repo_full_name"])
        .eq("user_id", user["id"])
        .execute()
    )
    
    if existing_member.data:
        raise HTTPException(status_code=409, detail="User already a member")
    
    # Add user to repository
    try:
        member_data = {
            "repo_full_name": invite["repo_full_name"],
            "user_id": user["id"],
            "github_username": user.get("user_metadata", {}).get("user_name", ""),
            "role": invite["role"],
            "added_by": invite["created_by"],
            "added_at": datetime.utcnow().isoformat(),
        }
        
        member_res = supabase.table("repo_members").insert(member_data).execute()
        
        if not member_res.data:
            raise HTTPException(status_code=500, detail="Failed to add member")
        
        # Mark invite as used
        supabase.table("repo_invites").update({
            "used": True,
            "used_by": user["id"],
            "used_at": datetime.utcnow().isoformat(),
        }).eq("code", request.code).execute()
        
        return {
            "success": True,
            "message": "Successfully joined repository",
            "repo": invite["repo_full_name"],
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== ADMIN ENDPOINTS ====================

@router.get("/list")
def list_invites(repo_full_name: str, user=Depends(get_current_user)):
    """List all invites for a repository (admin only)"""
    supabase = get_db()
    
    # Check if user is admin
    repo_member = (
        supabase
        .table("repo_members")
        .select("role")
        .eq("repo_full_name", repo_full_name)
        .eq("user_id", user["id"])
        .execute()
    )
    
    if not repo_member.data or repo_member.data[0]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all invites
    invites = (
        supabase
        .table("repo_invites")
        .select("code, role, created_at, expires_at, used, used_at")
        .eq("repo_full_name", repo_full_name)
        .execute()
    )
    
    return {"invites": invites.data or []}


@router.post("/revoke")
def revoke_invite(code: str, user=Depends(get_current_user)):
    """Revoke an invite (admin only)"""
    supabase = get_db()
    
    # Get invite
    invite_res = (
        supabase
        .table("repo_invites")
        .select("*")
        .eq("code", code)
        .single()
        .execute()
    )
    
    if not invite_res.data:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    invite = invite_res.data
    
    # Check if user is admin of repo
    repo_member = (
        supabase
        .table("repo_members")
        .select("role")
        .eq("repo_full_name", invite["repo_full_name"])
        .eq("user_id", user["id"])
        .execute()
    )
    
    if not repo_member.data or repo_member.data[0]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Delete invite
    supabase.table("repo_invites").delete().eq("code", code).execute()
    
    return {"success": True, "message": "Invite revoked"}
