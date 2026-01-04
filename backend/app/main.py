from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.github import router as github_router
from app.routes.dashboard import router as dashboard_router
from app.routes.manager import router as manager_router
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.repo_files import router as repo_files_router
from app.routes.contributor import router as contributor_router
from app.redis_client import redis_client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

redis_client.set("health", "ok")
print(redis_client.get("health"))

app.include_router(auth_router)
app.include_router(github_router)
app.include_router(dashboard_router)
app.include_router(manager_router)
app.include_router(user_router)
app.include_router(repo_files_router)
app.include_router(contributor_router)