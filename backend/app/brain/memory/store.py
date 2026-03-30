from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
import json

class MessageMemory(BaseModel):
    """Single message in conversation history"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    sources: Optional[List[dict]] = None
    confidence: Optional[str] = None

class ConversationMemory(BaseModel):
    """Conversation history for a user-repo pair"""
    conversation_id: str
    user_id: str
    repo_full_name: str
    messages: List[MessageMemory] = []
    created_at: datetime
    updated_at: datetime
    summary: Optional[str] = None  # Summary of conversation
    
    def add_message(self, role: str, content: str, sources=None, confidence=None):
        """Add a message to conversation"""
        self.messages.append(
            MessageMemory(
                role=role,
                content=content,
                timestamp=datetime.now(),
                sources=sources,
                confidence=confidence
            )
        )
        self.updated_at = datetime.now()
    
    def get_recent_context(self, max_messages: int = 5) -> str:
        """Get recent messages as context for LLM"""
        recent = self.messages[-max_messages:]
        context = []
        for msg in recent:
            role_label = "User" if msg.role == "user" else "Assistant"
            context.append(f"{role_label}: {msg.content}")
        return "\n".join(context)
    
    def get_conversation_summary(self) -> str:
        """Get summary of what was discussed"""
        if self.summary:
            return self.summary
        
        # Generate summary from messages
        topics = set()
        for msg in self.messages:
            if msg.role == "user":
                # Extract key topics from user questions
                words = msg.content.lower().split()
                topics.update(words[:3])  # Take first 3 words as topic hints
        
        return f"Discussed: {', '.join(list(topics)[:5])}"

class MemoryStore:
    """In-memory storage for conversations"""
    
    def __init__(self):
        self.conversations: dict[str, ConversationMemory] = {}
    
    def get_or_create_conversation(
        self,
        user_id: str,
        repo_full_name: str
    ) -> ConversationMemory:
        """Get existing conversation or create new one"""
        conversation_id = f"{user_id}:{repo_full_name}"
        
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = ConversationMemory(
                conversation_id=conversation_id,
                user_id=user_id,
                repo_full_name=repo_full_name,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        
        return self.conversations[conversation_id]
    
    def add_message(
        self,
        user_id: str,
        repo_full_name: str,
        role: str,
        content: str,
        sources=None,
        confidence=None
    ):
        """Add message to conversation"""
        conversation = self.get_or_create_conversation(user_id, repo_full_name)
        conversation.add_message(role, content, sources, confidence)
    
    def get_conversation(self, user_id: str, repo_full_name: str) -> Optional[ConversationMemory]:
        """Get conversation by user and repo"""
        conversation_id = f"{user_id}:{repo_full_name}"
        return self.conversations.get(conversation_id)
    
    def clear_conversation(self, user_id: str, repo_full_name: str):
        """Clear conversation history"""
        conversation_id = f"{user_id}:{repo_full_name}"
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def export_conversation(self, user_id: str, repo_full_name: str) -> str:
        """Export conversation as JSON"""
        conversation = self.get_conversation(user_id, repo_full_name)
        if not conversation:
            return ""
        
        data = {
            "conversation_id": conversation.conversation_id,
            "repo": conversation.repo_full_name,
            "created_at": conversation.created_at.isoformat(),
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "confidence": msg.confidence
                }
                for msg in conversation.messages
            ]
        }
        return json.dumps(data, indent=2)

# Global memory instance
_memory_store: Optional[MemoryStore] = None

def get_memory_store() -> MemoryStore:
    """Get or create global memory store"""
    global _memory_store
    if _memory_store is None:
        _memory_store = MemoryStore()
    return _memory_store