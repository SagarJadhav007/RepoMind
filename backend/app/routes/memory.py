from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.supabase import get_current_user
from app.brain.memory.store import get_memory_store

router = APIRouter(prefix="/memory")

memory_store = get_memory_store()

@router.get("/conversation")
async def get_conversation(
    repo_full_name: str = Query(...),
    user=Depends(get_current_user),
):
    """Get conversation history for user and repo"""
    try:
        conversation = memory_store.get_conversation(user["id"], repo_full_name)
        
        if not conversation:
            return {
                "conversation_id": None,
                "messages": [],
                "summary": "No conversation yet"
            }
        
        return {
            "conversation_id": conversation.conversation_id,
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "confidence": msg.confidence
                }
                for msg in conversation.messages
            ],
            "summary": conversation.get_conversation_summary(),
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        }
    except Exception as e:
        print(f"Error fetching conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversation")
async def clear_conversation(
    repo_full_name: str = Query(...),
    user=Depends(get_current_user),
):
    """Clear conversation history"""
    try:
        memory_store.clear_conversation(user["id"], repo_full_name)
        
        return {
            "status": "success",
            "message": f"Cleared conversation for {repo_full_name}"
        }
    except Exception as e:
        print(f"Error clearing conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/export")
async def export_conversation(
    repo_full_name: str = Query(...),
    user=Depends(get_current_user),
):
    """Export conversation as JSON"""
    try:
        data = memory_store.export_conversation(user["id"], repo_full_name)
        
        if not data:
            raise HTTPException(status_code=404, detail="No conversation found")
        
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        print(f"Error exporting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))