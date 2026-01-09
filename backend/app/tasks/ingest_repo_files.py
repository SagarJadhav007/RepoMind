import base64
from datetime import datetime
import requests

from app.db import get_db
from app.services.github_auth import get_installation_access_token
from app.services.chunker import chunk_text
from app.brain.embedding import embed_text

BASE_URL = "https://api.github.com"

ALLOWED_EXTENSIONS = (
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".go", ".java", ".rs", ".md",
    ".json", ".yaml", ".yml",
    ".html", ".css", ".ipynb",
)

MAX_FILE_SIZE = 300_000  # 300 KB


def _headers(token: str):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }


def is_valid_file(path: str, size: int | None):
    if not size or size > MAX_FILE_SIZE:
        return False
    if path.startswith(("node_modules/", ".git/")):
        return False
    return path.endswith(ALLOWED_EXTENSIONS)


def get_extension(path: str):
    return "." + path.split(".")[-1] if "." in path else None


def get_repo_tree(token: str, owner: str, repo: str, branch: str):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/git/trees/{branch}",
        headers=_headers(token),
        params={"recursive": "1"},
        timeout=20,
    )
    if r.status_code != 200:
        return []
    return r.json().get("tree", [])


def get_file_content(token: str, owner: str, repo: str, path: str, branch: str):
    r = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/contents/{path}",
        headers=_headers(token),
        params={"ref": branch},
        timeout=20,
    )
    if r.status_code != 200:
        return None

    data = r.json()
    if data.get("encoding") != "base64":
        return None

    return base64.b64decode(data["content"]).decode("utf-8", errors="ignore")


def ingest_repo_files(
    repo_full_name: str,
    installation_id: int,
    user_id: str,
    limit: int = 150,
):
    """
    Ingest repo files + generate RAG embeddings (Gemini).
    Safe, incremental, repo-scoped.
    """

    owner, repo = repo_full_name.split("/")

    token = get_installation_access_token(installation_id)
    supabase = get_db()

    # ---------------- Repo Metadata ---------------- #

    meta = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}",
        headers=_headers(token),
        timeout=10,
    ).json()

    branch = meta.get("default_branch", "main")

    # ---------------- Fetch Tree ---------------- #

    tree = get_repo_tree(token, owner, repo, branch)

    files = [
        f for f in tree
        if f["type"] == "blob" and is_valid_file(f["path"], f.get("size"))
    ][:limit]

    synced = skipped = failed = embedded = 0

    for f in files:
        path = f["path"]
        sha = f["sha"]

        # ---------------- SHA Check ---------------- #

        existing = (
            supabase
            .table("repo_files")
            .select("sha")
            .eq("repo_full_name", repo_full_name)
            .eq("path", path)
            .limit(1)
            .execute()
        )

        if existing.data and existing.data[0]["sha"] == sha:
            skipped += 1
            continue

        # ---------------- Fetch Content ---------------- #

        content = get_file_content(token, owner, repo, path, branch)
        if not content:
            failed += 1
            continue

        # ---------------- Store Raw File ---------------- #

        supabase.table("repo_files").upsert({
            "repo_full_name": repo_full_name,
            "installation_id": installation_id,
            "path": path,
            "extension": get_extension(path),
            "size": f.get("size"),
            "sha": sha,
            "content": content,
            "last_synced_at": datetime.utcnow().isoformat(),
        }).execute()

        synced += 1

        # ---------------- RAG: Rebuild Embeddings ---------------- #

        # Delete old embeddings for this file (important)
        supabase.table("repo_embeddings") \
            .delete() \
            .eq("repo_full_name", repo_full_name) \
            .eq("path", path) \
            .execute()

        chunks = chunk_text(content)

        for idx, chunk in enumerate(chunks):
            try:
                embedding = embed_text(chunk)
                print("Embedding OK:", type(embedding), len(embedding))

                supabase.table("repo_embeddings").insert({
                    "repo_full_name": repo_full_name,
                    "path": path,
                    "content": chunk,
                    "embedding": embedding,
                    "metadata": {
                        "chunk_index": idx,
                    },
                }).execute()

                embedded += 1

            except Exception as e:
                print("EMBED INSERT ERROR:", e)
                raise

    return {
        "repo": repo_full_name,
        "total_files": len(files),
        "synced_files": synced,
        "skipped_files": skipped,
        "failed_files": failed,
        "embedded_chunks": embedded,
    }
