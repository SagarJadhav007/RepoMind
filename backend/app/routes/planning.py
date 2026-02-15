from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.auth.supabase import get_current_user
from app.db import get_db
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from app.services.role_service import get_user_role_in_repo

router = APIRouter(prefix="/planning")

# ==================== Models ====================
class CardData(BaseModel):
    title: str
    description: str
    linkedPR: Optional[int] = None
    linkedIssue: Optional[int] = None

class ColumnData(BaseModel):
    title: str
    description: str
    color: str

class ReorderColumnsRequest(BaseModel):
    column_ids: List[str]

class ReorderCardsRequest(BaseModel):
    card_ids: List[str]

class ColumnWithCards(BaseModel):
    id: str
    title: str
    description: str
    color: str
    position: int
    cards: List[dict]

class BoardResponse(BaseModel):
    id: str
    columns: List[ColumnWithCards]

# ==================== Board Routes ====================

@router.get("/board")
def get_board(repo: str, user=Depends(get_current_user)):
    """Get the planning board for a specific repo"""
    supabase = get_db()
    
    # Check if user has access to this repo
    role = get_user_role_in_repo(user["id"], repo)
    if not role:
        raise HTTPException(403, "You don't have access to this repository")
    
    # Get or create board
    board_res = supabase.table("planning_boards").select("id").eq(
        "user_id", user["id"]
    ).eq("repo_full_name", repo).execute()
    
    if not board_res.data:
        # Create new board
        board_res = supabase.table("planning_boards").insert({
            "user_id": user["id"],
            "repo_full_name": repo
        }).execute()
        board_id = board_res.data[0]["id"]
    else:
        board_id = board_res.data[0]["id"]
    
    # Get all columns with their cards
    columns_res = supabase.table("planning_columns").select(
        "id, title, description, color, position"
    ).eq("board_id", board_id).order("position").execute()
    
    columns = []
    for column in columns_res.data:
        cards_res = supabase.table("planning_cards").select("*").eq(
            "column_id", column["id"]
        ).order("position").execute()
        
        columns.append({
            "id": column["id"],
            "title": column["title"],
            "description": column["description"],
            "color": column["color"],
            "position": column["position"],
            "cards": [
                {
                    "id": card["id"],
                    "title": card["title"],
                    "description": card["description"],
                    "linkedPR": card["linked_pr"],
                    "linkedIssue": card["linked_issue"],
                }
                for card in cards_res.data
            ]
        })
    
    return {
        "id": board_id,
        "columns": columns
    }

# ==================== Column Routes ====================

@router.post("/columns")
def create_column(repo: str, data: ColumnData, user=Depends(get_current_user)):
    """Create a new column - requires maintainer role"""
    supabase = get_db()
    
    # Check if user has maintainer or admin role
    role = get_user_role_in_repo(user["id"], repo)
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can create columns")
    
    # Get board
    board_res = supabase.table("planning_boards").select("id").eq(
        "user_id", user["id"]
    ).eq("repo_full_name", repo).execute()
    
    if not board_res.data:
        raise HTTPException(status_code=404, detail="Board not found")
    
    board_id = board_res.data[0]["id"]
    
    # Get max position
    max_pos_res = supabase.table("planning_columns").select("position").eq(
        "board_id", board_id
    ).order("position", desc=True).limit(1).execute()
    
    position = (max_pos_res.data[0]["position"] + 1) if max_pos_res.data else 0
    
    # Create column
    result = supabase.table("planning_columns").insert({
        "board_id": board_id,
        "title": data.title,
        "description": data.description,
        "color": data.color,
        "position": position
    }).execute()
    
    return result.data[0]

@router.put("/columns/reorder")
def reorder_columns(repo: str = Query(...), data: ReorderColumnsRequest = Body(...), user=Depends(get_current_user)):
    """Reorder columns - requires maintainer role"""
    supabase = get_db()
    
    # Check if user has maintainer or admin role
    role = get_user_role_in_repo(user["id"], repo)
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can reorder columns")
    
    # Get board and verify ownership
    board_res = supabase.table("planning_boards").select("id").eq(
        "user_id", user["id"]
    ).eq("repo_full_name", repo).execute()
    
    if not board_res.data:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Update positions
    for position, column_id in enumerate(data.column_ids):
        supabase.table("planning_columns").update({
            "position": position,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", column_id).execute()
    
    return {"message": "Columns reordered"}

@router.put("/columns/{column_id}")
def update_column(column_id: str, data: ColumnData, user=Depends(get_current_user)):
    """Update a column - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get role
    board_id = verify_column_ownership(supabase, column_id, user["id"])
    
    # Get repo from board
    board = supabase.table("planning_boards").select("repo_full_name").eq("id", board_id).single().execute()
    if not board.data:
        raise HTTPException(404, "Board not found")
    
    role = get_user_role_in_repo(user["id"], board.data["repo_full_name"])
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can update columns")
    
    result = supabase.table("planning_columns").update({
        "title": data.title,
        "description": data.description,
        "color": data.color,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", column_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Column not found")
    
    return result.data[0]

@router.delete("/columns/{column_id}")
def delete_column(column_id: str, user=Depends(get_current_user)):
    """Delete a column - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get role
    board_id = verify_column_ownership(supabase, column_id, user["id"])
    
    # Get repo from board
    board = supabase.table("planning_boards").select("repo_full_name").eq("id", board_id).single().execute()
    if not board.data:
        raise HTTPException(404, "Board not found")
    
    role = get_user_role_in_repo(user["id"], board.data["repo_full_name"])
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can delete columns")
    
    supabase.table("planning_columns").delete().eq("id", column_id).execute()
    
    return {"message": "Column deleted"}

# ==================== Card Routes ====================

@router.post("/columns/{column_id}/cards")
def create_card(column_id: str, data: CardData, user=Depends(get_current_user)):
    """Create a new card - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get role
    board_id = verify_column_ownership(supabase, column_id, user["id"])
    
    # Get repo from board
    board = supabase.table("planning_boards").select("repo_full_name").eq("id", board_id).single().execute()
    if not board.data:
        raise HTTPException(404, "Board not found")
    
    role = get_user_role_in_repo(user["id"], board.data["repo_full_name"])
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can create cards")
    
    # Get max position
    max_pos_res = supabase.table("planning_cards").select("position").eq(
        "column_id", column_id
    ).order("position", desc=True).limit(1).execute()
    
    position = (max_pos_res.data[0]["position"] + 1) if max_pos_res.data else 0
    
    # Create card
    result = supabase.table("planning_cards").insert({
        "column_id": column_id,
        "title": data.title,
        "description": data.description,
        "linked_pr": data.linkedPR,
        "linked_issue": data.linkedIssue,
        "position": position
    }).execute()
    
    card = result.data[0]
    return {
        "id": card["id"],
        "title": card["title"],
        "description": card["description"],
        "linkedPR": card["linked_pr"],
        "linkedIssue": card["linked_issue"],
    }

@router.put("/cards/move")
def move_card(card_id: str, to_column_id: str, position: int, user=Depends(get_current_user)):
    """Move a card to a different column or position - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get repo
    repo = verify_card_ownership(supabase, card_id, user["id"])
    
    # Check role
    role = get_user_role_in_repo(user["id"], repo)
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can move cards")
    
    verify_column_ownership(supabase, to_column_id, user["id"])
    
    result = supabase.table("planning_cards").update({
        "column_id": to_column_id,
        "position": position,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", card_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return result.data[0]

@router.put("/cards/reorder")
def reorder_cards(column_id: str = Query(...), data: ReorderCardsRequest = Body(...), user=Depends(get_current_user)):
    """Reorder cards in a column - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get board_id
    board_id = verify_column_ownership(supabase, column_id, user["id"])
    
    # Get repo from board
    board = supabase.table("planning_boards").select("repo_full_name").eq("id", board_id).single().execute()
    if not board.data:
        raise HTTPException(404, "Board not found")
    
    # Check role
    role = get_user_role_in_repo(user["id"], board.data["repo_full_name"])
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can reorder cards")
    
    # Update positions
    for position, card_id in enumerate(data.card_ids):
        supabase.table("planning_cards").update({
            "position": position,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", card_id).execute()
    
    return {"message": "Cards reordered"}

@router.put("/cards/{card_id}")
def update_card(card_id: str, data: CardData, user=Depends(get_current_user)):
    """Update a card - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get repo
    repo = verify_card_ownership(supabase, card_id, user["id"])
    
    # Check role
    role = get_user_role_in_repo(user["id"], repo)
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can update cards")
    
    result = supabase.table("planning_cards").update({
        "title": data.title,
        "description": data.description,
        "linked_pr": data.linkedPR,
        "linked_issue": data.linkedIssue,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", card_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card = result.data[0]
    return {
        "id": card["id"],
        "title": card["title"],
        "description": card["description"],
        "linkedPR": card["linked_pr"],
        "linkedIssue": card["linked_issue"],
    }

@router.delete("/cards/{card_id}")
def delete_card(card_id: str, user=Depends(get_current_user)):
    """Delete a card - requires maintainer role"""
    supabase = get_db()
    
    # Verify ownership and get repo
    repo = verify_card_ownership(supabase, card_id, user["id"])
    
    # Check role
    role = get_user_role_in_repo(user["id"], repo)
    if role not in ["admin", "maintainer"]:
        raise HTTPException(403, "Only maintainers can delete cards")
    
    supabase.table("planning_cards").delete().eq("id", card_id).execute()
    
    return {"message": "Card deleted"}

# ==================== Helper Functions ====================

def verify_column_ownership(supabase, column_id: str, user_id: str):
    """Verify that the user owns the column and return board_id"""
    result = supabase.table("planning_columns").select(
        "board_id, planning_boards(user_id)"
    ).eq("id", column_id).execute()
    
    if not result.data or result.data[0]["planning_boards"]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    return result.data[0]["board_id"]

def verify_card_ownership(supabase, card_id: str, user_id: str):
    """Verify that the user owns the card and return repo_full_name"""
    result = supabase.table("planning_cards").select(
        "planning_columns(board_id, planning_boards(user_id, repo_full_name))"
    ).eq("id", card_id).execute()
    
    if not result.data or result.data[0]["planning_columns"]["planning_boards"]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    return result.data[0]["planning_columns"]["planning_boards"]["repo_full_name"]
