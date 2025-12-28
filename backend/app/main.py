from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.github import router as github_router
from app.routes.dashboard import router as dashboard_router
from app.routes.manager import router as manager_router

app = FastAPI()

# 🔓 Allow ALL origins (dev-friendly)
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

app.include_router(github_router)
app.include_router(dashboard_router)
app.include_router(manager_router)