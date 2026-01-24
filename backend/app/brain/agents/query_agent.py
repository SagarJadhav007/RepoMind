from typing import Optional
from app.brain.schema import BrainRequest
from app.brain.context.base import retrieve_repo_embeddings
from app.brain.embedding import embed_text
from app.brain.llm.provider import get_llm
import json

class QueryAnsweringAgent:
    """
    Specialized agent for answering user queries about repositories.
    Uses function-based chunking and semantic routing.
    """
    
    def __init__(self):
        self.llm = get_llm()
        self.tools = self._define_tools()
    
    def _define_tools(self):
        """Define available tools for the agent"""
        return {
            "search_codebase": {
                "description": "Search for relevant code snippets based on semantic similarity",
                "params": {
                    "query": "str - user's question or search term",
                    "limit": "int - number of results (default 6)"
                }
            },
            "search_documentation": {
                "description": "Search for relevant documentation files (README, docs, etc)",
                "params": {
                    "query": "str - documentation search term",
                    "limit": "int - number of results (default 4)"
                }
            },
            "search_by_function": {
                "description": "Search for specific functions/classes in the codebase",
                "params": {
                    "function_name": "str - name or pattern to search",
                    "file_extension": "str - filter by language (.py, .js, etc)"
                }
            }
        }
    
    async def process(self, req: BrainRequest) -> dict:
        """Main agent loop - decide what tools to use based on query"""
        message = req.payload["message"]
        
        # Step 1: Classify the query intent
        intent = await self._classify_intent(message)
        
        # Step 2: Select and execute tools based on intent
        search_results = await self._execute_tools(
            repo_full_name=req.repo_full_name,
            message=message,
            intent=intent
        )
        
        # Step 3: Synthesize answer using retrieved context
        answer = await self._synthesize_answer(
            message=message,
            context=search_results,
            intent=intent
        )
        
        return {
            "answer": answer["text"],
            "sources": answer["sources"],
            "confidence": answer["confidence"],
            "reasoning": answer.get("reasoning")
        }
    
    async def _classify_intent(self, message: str) -> str:
        """Use LLM to classify query intent"""
        prompt = f"""Classify this repository question into ONE category:
        - architecture: "How is X organized?", "Explain the structure"
        - implementation: "How does X work?", "Show me X code"
        - usage: "How do I use X?", "What's the API?"
        - bug: "Why is X broken?", "Help debug"
        - comparison: "What's the difference between X and Y?"
        - general: Other questions
        
        Question: {message}
        
        Return ONLY the category name, nothing else."""
        
        response = self.llm.generate(prompt)
        return response.strip().lower()
    
    async def _execute_tools(self, repo_full_name: str, message: str, intent: str) -> dict:
        """Execute appropriate tools based on intent"""
        
        if intent == "architecture":
            return await self._search_architecture(repo_full_name, message)
        elif intent == "implementation":
            return await self._search_implementation(repo_full_name, message)
        elif intent == "usage":
            return await self._search_documentation(repo_full_name, message)
        else:
            # Default: hybrid search
            return await self._search_hybrid(repo_full_name, message)
    
    async def _search_architecture(self, repo_full_name: str, query: str) -> dict:
        """Search for architectural patterns and structure"""
        query_embedding = embed_text(query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=8,
            file_pattern=r"(__init__|setup|package|architecture|structure|readme)"
        )
        
        return {
            "results": matches,
            "strategy": "architecture"
        }
    
    async def _search_implementation(self, repo_full_name: str, query: str) -> dict:
        """Search for specific function/class implementations"""
        # Extract function/class names from query
        prompt = f"""Extract function, class, or module names from: "{query}"
        Return ONLY names, one per line. If none, return "GENERAL_SEARCH"."""
        
        names = self.llm.generate(prompt).strip().split("\n")
        
        query_embedding = embed_text(query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=6,
            search_names=names
        )
        
        return {
            "results": matches,
            "strategy": "implementation",
            "target_names": names
        }
    
    async def _search_documentation(self, repo_full_name: str, query: str) -> dict:
        """Search documentation first, then code"""
        query_embedding = embed_text(query)
        
        # Prioritize markdown, rst, txt docs
        doc_matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=4,
            file_pattern=r"\.(md|rst|txt)$"
        )
        
        # Fallback to code if docs insufficient
        if len(doc_matches) < 2:
            code_matches = retrieve_repo_embeddings(
                repo_full_name=repo_full_name,
                query_embedding=query_embedding,
                limit=4
            )
            matches = doc_matches + code_matches
        else:
            matches = doc_matches
        
        return {
            "results": matches,
            "strategy": "documentation"
        }
    
    async def _search_hybrid(self, repo_full_name: str, query: str) -> dict:
        """Hybrid search combining code and docs"""
        query_embedding = embed_text(query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=8
        )
        
        return {
            "results": matches,
            "strategy": "hybrid"
        }
    
    async def _synthesize_answer(self, message: str, context: dict, intent: str) -> dict:
        """Use LLM to synthesize final answer from context"""
        
        context_blocks = []
        sources = []
        
        for match in context.get("results", []):
            context_blocks.append(f"""
FILE: {match['path']}
CONTENT:
{match['content']}
""".strip())
            sources.append({
                "file": match['path'],
                "snippet": match['content'][:200]
            })
        
        prompt = f"""You are a GitHub repository expert assistant.

USER QUESTION:
{message}

INTENT: {intent}

RETRIEVED CODE CONTEXT:
{chr(10).join(context_blocks)}

INSTRUCTIONS:
1. Answer DIRECTLY addressing the user's question
2. Use ONLY the provided code context - don't guess
3. Explain in simple terms with code examples
4. If context is insufficient, say "I couldn't find enough information"
5. Be concise but thorough

Return JSON:
{{
  "text": "Your answer here",
  "confidence": "high|medium|low",
  "reasoning": "Why this confidence level"
}}
"""
        
        response = self.llm.generate(prompt)
        
        try:
            result = json.loads(response)
        except:
            result = {
                "text": response,
                "confidence": "low",
                "reasoning": "Parsing error in LLM response"
            }
        
        return {
            "text": result.get("text", ""),
            "sources": sources,
            "confidence": result.get("confidence", "medium"),
            "reasoning": result.get("reasoning", "")
        }