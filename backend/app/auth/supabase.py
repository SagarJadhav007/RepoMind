from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import requests
import os

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_current_user(token=Depends(security)):
    res = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token.credentials}",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
        },
    )

    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Supabase token")

    return res.json()

