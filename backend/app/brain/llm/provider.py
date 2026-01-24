import os
from typing import Optional
from app.brain.llm.gemini import GeminiLLM

# Global instance
_llm_instance = None

def get_llm() -> GeminiLLM:
    """Get or create LLM instance"""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = GeminiLLM()
    return _llm_instance
