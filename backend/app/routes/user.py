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
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    skills: Optional[List[str]] = None
    profile_picture_url: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    username: str
    email: str
    bio: Optional[str]
    location: Optional[str]
    timezone: Optional[str]
    skills: Optional[List[str]]
    profile_picture_url: Optional[str]
    created_at: str
    updated_at: str

class UserDirectory(BaseModel):
    id: str
    username: str
    full_name: str
    skills: Optional[List[str]]
    timezone: Optional[str]

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
    """Get user profile - returns 404 if profile doesn't exist"""
    supabase = get_db()
    
    res = (
        supabase
        .table("user_profiles")
        .select("*")
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return res.data


@router.post("/profile", response_model=UserProfileResponse)
def create_or_update_profile(
    profile: UserProfile,
    user=Depends(get_current_user)
):
    """Create or update user profile"""
    supabase = get_db()
    
    # Check if profile exists
    existing = (
        supabase
        .table("user_profiles")
        .select("id")
        .eq("user_id", user["id"])
        .execute()
    )
    
    profile_data = {
        "user_id": user["id"],
        "full_name": profile.full_name,
        "bio": profile.bio,
        "location": profile.location,
        "timezone": profile.timezone,
        "skills": profile.skills or [],
        "profile_picture_url": profile.profile_picture_url,
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    if existing.data:
        # Update existing profile
        res = (
            supabase
            .table("user_profiles")
            .update(profile_data)
            .eq("user_id", user["id"])
            .execute()
        )
    else:
        # Create new profile
        profile_data["created_at"] = datetime.utcnow().isoformat()
        res = (
            supabase
            .table("user_profiles")
            .insert(profile_data)
            .execute()
        )
    
    return res.data[0] if res.data else profile_data


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
        query = supabase.table("user_profiles").select("user_id, full_name, timezone, skills")
        
        # Add search filter if provided
        if search:
            # Use Supabase full-text search or filter (depends on DB setup)
            # For now, we'll fetch all and filter in Python
            pass
        
        query = query.limit(limit)
        res = query.execute()
        
        users = []
        for profile in res.data:
            # Get username from auth users if available
            users.append({
                "id": profile["user_id"],
                "username": profile.get("username", ""),  # Will need to join with auth table
                "full_name": profile.get("full_name", ""),
                "timezone": profile.get("timezone"),
                "skills": profile.get("skills", [])
            })
        
        # Filter by search query in Python if needed
        if search:
            search_lower = search.lower()
            users = [
                u for u in users 
                if search_lower in u["full_name"].lower() or 
                   search_lower in u.get("username", "").lower()
            ]
        
        return {"users": users}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))