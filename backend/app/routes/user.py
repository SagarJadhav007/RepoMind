from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from app.auth.supabase import get_current_user
from app.db import get_db
from app.services.github_auth import get_installation_access_token
from app.services.github_api_service import ingest_repo_snapshot
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os

router = APIRouter(prefix="/user", tags=["User"])

# ==================== PYDANTIC MODELS ====================

class UserProfile(BaseModel):
    """
    Request payload for creating/updating a user profile.

    This matches the public.user_profiles table:
      id uuid primary key references auth.users (id) on delete cascade,
      username text not null unique,
      bio text,
      skills text[] default '{}'::text[],
      interested_domains text[] default '{}'::text[],
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    """
    username: str
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    interested_domains: Optional[List[str]] = None

class UserProfileResponse(BaseModel):
    """Minimal response model matching public.user_profiles."""
    id: str
    username: str
    email: str
    bio: Optional[str]
    skills: Optional[List[str]]
    interested_domains: Optional[List[str]]
    created_at: str
    updated_at: str


class UserDirectory(BaseModel):
    id: str
    username: str
    skills: Optional[List[str]]
    interested_domains: Optional[List[str]]

# ==================== EXISTING ENDPOINTS ====================

@router.get("/recent-repo")
def get_recent_repo(user=Depends(get_current_user)):
    supabase = get_db()

    res = (
        supabase
        .table("recent_repo")
        .select("repo")
        .eq("user_id", user["id"])
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )

    if res.data and len(res.data) > 0:
        return {"repo": res.data[0]["repo"]}

    return {"repo": None}


# ==================== NEW PROFILE ENDPOINTS ====================

@router.get("/profile", response_model=UserProfileResponse)
def get_profile(user=Depends(get_current_user)):
    """Get user profile from public.user_profiles - returns 404 if profile doesn't exist"""
    supabase = get_db()

    res = (
        supabase.table("user_profiles")
        .select("*")
        .eq("id", user["id"])
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    row = res.data

    # Map DB row to minimal response model
    return {
        "id": row["id"],
        "username": row["username"],
        "email": user.get("email", ""),
        "bio": row.get("bio"),
        "skills": row.get("skills") or [],
        "interested_domains": row.get("interested_domains") or [],
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


@router.post("/profile", response_model=UserProfileResponse)
def create_or_update_profile(
    profile: UserProfile,
    user=Depends(get_current_user)
):
    """Create or update user profile in public.user_profiles"""
    supabase = get_db()

    # Check if profile exists for this user (PK = id)
    existing = (
        supabase.table("user_profiles")
        .select("id")
        .eq("id", user["id"])
        .execute()
    )

    profile_data = {
        "id": user["id"],
        "username": profile.username,
        "bio": profile.bio,
        "skills": profile.skills or [],
        "interested_domains": profile.interested_domains or [],
        "updated_at": datetime.utcnow().isoformat(),
    }

    if existing.data:
        # Update existing profile
        res = (
            supabase.table("user_profiles")
            .update(profile_data)
            .eq("id", user["id"])
            .execute()
        )
    else:
        # Create new profile
        profile_data["created_at"] = datetime.utcnow().isoformat()
        res = supabase.table("user_profiles").insert(profile_data).execute()

    row = res.data[0] if res.data else profile_data

    return {
        "id": row["id"],
        "username": row["username"],
        "email": user.get("email", ""),
        "bio": row.get("bio"),
        "skills": row.get("skills") or [],
        "interested_domains": row.get("interested_domains") or [],
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


@router.post("/upload-profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload profile picture and return URL"""
    try:
        # Validate file size (5MB max)
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(status_code=400, detail="File must be JPEG or PNG")
        
        supabase = get_db()
        bucket_name = "user-profiles"
        
        # Create unique filename
        file_ext = "jpg" if file.content_type == "image/jpeg" else "png"
        filename = f"{user['id']}/{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase Storage
        res = supabase.storage.from_(bucket_name).upload(
            filename,
            contents,
            {
                "content-type": file.content_type,
                "cacheControl": "3600"
            }
        )
        
        # Get public URL
        url = supabase.storage.from_(bucket_name).get_public_url(filename)
        
        return {"url": url, "filename": filename}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/directory", response_model=dict)
def get_user_directory(
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    """Get directory of all RepoMind users with optional search"""
    supabase = get_db()
    
    try:
        # Match new schema: id, username, bio, skills, interested_domains
        query = supabase.table("user_profiles").select("id, username, skills, interested_domains")

        # Add search filter if provided
        if search:
            # Use Supabase full-text search or filter (depends on DB setup)
            # For now, we'll fetch all and filter in Python
            pass
        
        query = query.limit(limit)
        res = query.execute()
        
        users = []
        for profile in res.data:
            users.append({
                "id": profile["id"],
                "username": profile.get("username", ""),
                "skills": profile.get("skills", []),
                "interested_domains": profile.get("interested_domains", []),
            })

        # Filter by search query in Python if needed
        if search:
            search_lower = search.lower()
            users = [
                u for u in users
                if search_lower in u.get("username", "").lower()
            ]
        
        return {"users": users}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))