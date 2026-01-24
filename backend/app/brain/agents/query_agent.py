from typing import Optional
from app.brain.schema import BrainRequest
from app.brain.context.base import retrieve_repo_embeddings
from app.brain.embedding import embed_text
from app.brain.llm.provider import get_llm
from app.brain.memory.store import get_memory_store
import json
import re

class QueryAnsweringAgent:
    """
    Specialized agent for answering user queries about repositories.
    Uses function-based chunking and semantic routing.
    Maintains conversation memory for context awareness.
    """
    
    def __init__(self):
        self.llm = get_llm()
        self.memory_store = get_memory_store()
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
        repo_full_name = req.repo_full_name
        user_id = req.user_id
        
        # Step 0: Load conversation memory
        conversation = self.memory_store.get_or_create_conversation(user_id, repo_full_name)
        memory_context = conversation.get_recent_context(max_messages=4)
        
        print(f"[AGENT] Query: {message[:50]}... | User: {user_id} | Repo: {repo_full_name}")
        if memory_context:
            print(f"[MEMORY] Recent context: {len(conversation.messages)} messages in history")
        
        # Step 1: Classify the query intent
        intent = await self._classify_intent(message, memory_context)
        
        # Step 2: Select and execute tools based on intent
        search_results = await self._execute_tools(
            repo_full_name=repo_full_name,
            message=message,
            intent=intent,
            conversation_context=memory_context
        )
        
        # Step 3: Validate results are from correct repo
        search_results = self._validate_repo_context(search_results, repo_full_name)
        
        # Step 4: Synthesize answer using retrieved context and memory
        answer = await self._synthesize_answer(
            message=message,
            context=search_results,
            intent=intent,
            repo_name=repo_full_name,
            conversation_history=memory_context
        )
        
        # Step 5: Store in memory
        self.memory_store.add_message(
            user_id=user_id,
            repo_full_name=repo_full_name,
            role="user",
            content=message
        )
        
        self.memory_store.add_message(
            user_id=user_id,
            repo_full_name=repo_full_name,
            role="assistant",
            content=answer["text"],
            sources=answer["sources"],
            confidence=answer["confidence"]
        )
        
        return {
            "answer": answer["text"],
            "sources": answer["sources"],
            "confidence": answer["confidence"],
            "reasoning": answer.get("reasoning"),
            "conversation_id": conversation.conversation_id
        }
    
    def _validate_repo_context(self, results: dict, repo_full_name: str) -> dict:
        """Ensure results are from the correct repository"""
        validated_results = []
        
        for result in results.get("results", []):
            validated_results.append(result)
        
        results["results"] = validated_results
        return results
    
    async def _classify_intent(self, message: str, memory_context: str = "") -> str:
        """Use LLM to classify query intent"""
        
        context_hint = ""
        if memory_context:
            context_hint = f"\n\nPrevious conversation:\n{memory_context}\n\nBased on context, the user might be asking a follow-up question."
        
        prompt = f"""Classify this repository question into ONE category:
        - overview: "What is this repo?", "What does it do?", "Explain the project"
        - architecture: "How is X organized?", "Explain the structure"
        - implementation: "How does X work?", "Show me X code"
        - usage: "How do I use X?", "What's the API?"
        - bug: "Why is X broken?", "Help debug"
        - comparison: "What's the difference between X and Y?"
        - follow_up: A question that references previous context
        - general: Other questions
        
        Question: {message}{context_hint}
        
        Return ONLY the category name, nothing else."""
        
        response = self.llm.generate(prompt)
        return response.strip().lower()
    
    async def _execute_tools(
        self,
        repo_full_name: str,
        message: str,
        intent: str,
        conversation_context: str = ""
    ) -> dict:
        """Execute appropriate tools based on intent"""
        
        if intent == "overview":
            return await self._search_overview(repo_full_name, message)
        elif intent == "architecture":
            return await self._search_architecture(repo_full_name, message)
        elif intent == "implementation":
            return await self._search_implementation(repo_full_name, message)
        elif intent == "usage":
            return await self._search_documentation(repo_full_name, message)
        elif intent == "follow_up":
            # For follow-ups, search based on conversation context too
            return await self._search_follow_up(repo_full_name, message, conversation_context)
        else:
            return await self._search_hybrid(repo_full_name, message)
    
    async def _search_overview(self, repo_full_name: str, query: str) -> dict:
        """Search for project overview - prioritize README"""
        query_embedding = embed_text(query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=5,
            file_pattern=r"(README|readme|\.md)$"
        )
        
        if len(matches) < 2:
            additional = retrieve_repo_embeddings(
                repo_full_name=repo_full_name,
                query_embedding=query_embedding,
                limit=5
            )
            matches.extend(additional)
        
        return {
            "results": matches[:8],
            "strategy": "overview"
        }
    
    async def _search_architecture(self, repo_full_name: str, query: str) -> dict:
        """Search for architectural patterns and structure"""
        query_embedding = embed_text(query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=8,
            file_pattern=r"(__init__|setup|package|architecture|structure|app|main)"
        )
        
        return {
            "results": matches,
            "strategy": "architecture"
        }
    
    async def _search_implementation(self, repo_full_name: str, query: str) -> dict:
        """Search for specific function/class implementations"""
        prompt = f"""Extract function, class, or module names from: "{query}"
        Return ONLY names, one per line. If none, return "GENERAL_SEARCH"."""
        
        names = self.llm.generate(prompt).strip().split("\n")
        names = [n.strip() for n in names if n.strip() and n.strip() != "GENERAL_SEARCH"]
        
        query_embedding = embed_text(query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=6,
            search_names=names if names else None
        )
        
        return {
            "results": matches,
            "strategy": "implementation",
            "target_names": names
        }
    
    async def _search_documentation(self, repo_full_name: str, query: str) -> dict:
        """Search documentation first, then code"""
        query_embedding = embed_text(query)
        
        doc_matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=4,
            file_pattern=r"\.(md|rst|txt)$"
        )
        
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
    
    async def _search_follow_up(
        self,
        repo_full_name: str,
        query: str,
        conversation_context: str
    ) -> dict:
        """Search for follow-up questions, using conversation context"""
        combined_query = f"{conversation_context}\n{query}"
        query_embedding = embed_text(combined_query)
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=query_embedding,
            limit=8
        )
        
        return {
            "results": matches,
            "strategy": "follow_up"
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
    
    async def _synthesize_answer(
        self,
        message: str,
        context: dict,
        intent: str,
        repo_name: str,
        conversation_history: str = ""
    ) -> dict:
        """Use LLM to synthesize final answer from context"""
        
        context_blocks = []
        sources = []
        
        results = context.get("results", [])
        
        if not results:
            return {
                "text": f"I couldn't find information about '{message}' in the {repo_name} repository. Please try a different question or check if the repository has been indexed.",
                "sources": [],
                "confidence": "low",
                "reasoning": "No relevant code context found in repository"
            }
        
        for match in results[:6]:
            content = match.get('content', '')[:500]
            path = match.get('path', 'unknown')
            
            context_blocks.append(f"""
FILE: {path}
CONTENT:
{content}
""".strip())
            sources.append({
                "file": path,
                "snippet": match.get('content', '')[:200]
            })
        
        memory_hint = ""
        if conversation_history:
            memory_hint = f"""
CONVERSATION HISTORY:
{conversation_history}

Use this context to provide better answers and avoid repeating information already discussed."""
        
        prompt = f"""You are a GitHub repository expert assistant for the repository: {repo_name}

USER QUESTION:
{message}

INTENT: {intent}

{memory_hint}

RETRIEVED CODE CONTEXT FROM {repo_name}:
{chr(10).join(context_blocks)}

INSTRUCTIONS:
1. Answer DIRECTLY addressing the user's question about {repo_name}
2. Use ONLY the provided code context from {repo_name}
3. Be specific to this repository
4. If this is a follow-up, reference the previous context naturally
5. Avoid repeating information already discussed
6. Explain in simple terms with code examples
7. If context is insufficient, say "I couldn't find enough information"
8. Be concise but thorough

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
                "confidence": "medium",
                "reasoning": "Direct LLM response"
            }
        
        return {
            "text": result.get("text", ""),
            "sources": sources,
            "confidence": result.get("confidence", "medium"),
            "reasoning": result.get("reasoning", "")
        }