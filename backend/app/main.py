from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.github import router as github_router
from app.routes.dashboard import router as dashboard_router
from app.routes.manager import router as manager_router
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.repo_files import router as repo_files_router
from app.routes.contributor import router as contributor_router
from app.routes.brain import router as brain_router
from app.routes.planning import router as planning_router
from app.routes.memory import router as memory_router
from app.routes.invite import router as invite_router

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

app.include_router(auth_router)
app.include_router(github_router)
app.include_router(dashboard_router)
app.include_router(manager_router)
app.include_router(user_router)
app.include_router(repo_files_router)
app.include_router(contributor_router)
app.include_router(brain_router, prefix="/chat", tags=["chat"])
app.include_router(memory_router, tags=["memory"])
app.include_router(planning_router)
app.include_router(invite_router)