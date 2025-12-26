from fastapi import FastAPI
from app.routes.github import router as github_router

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(github_router)
