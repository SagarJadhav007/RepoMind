from typing import List, Dict, Optional
from app.brain.schema import BrainRequest
from app.brain.context.base import retrieve_repo_embeddings
from app.brain.embedding import embed_text
from app.brain.llm.provider import get_llm
import json
import re
from enum import Enum

class ReviewPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class PRReviewAgent:
    """
    Specialized agent for reviewing PRs, tagging them, and recommending human review.
    """
    
    def __init__(self):
        self.llm = get_llm()
        self.review_categories = self._define_categories()
    
    def _define_categories(self) -> dict:
        """Define PR tagging categories"""
        return {
            "security": {
                "keywords": ["auth", "password", "encryption", "sql injection", "xss", "csrf"],
                "priority": ReviewPriority.CRITICAL,
                "description": "Security implications"
            },
            "performance": {
                "keywords": ["query", "loop", "algorithm", "cache", "optimization", "memory"],
                "priority": ReviewPriority.HIGH,
                "description": "Performance impact"
            },
            "breaking_change": {
                "keywords": ["api", "interface", "version", "deprecat", "breaking"],
                "priority": ReviewPriority.HIGH,
                "description": "May break existing code"
            },
            "database": {
                "keywords": ["migration", "schema", "database", "model", "relation"],
                "priority": ReviewPriority.HIGH,
                "description": "Database changes"
            },
            "testing": {
                "keywords": ["test", "coverage", "mock", "fixture", "assert"],
                "priority": ReviewPriority.MEDIUM,
                "description": "Test coverage"
            },
            "documentation": {
                "keywords": ["doc", "readme", "comment", "docstring"],
                "priority": ReviewPriority.LOW,
                "description": "Documentation changes"
            },
            "refactoring": {
                "keywords": ["refactor", "cleanup", "format", "style", "rename"],
                "priority": ReviewPriority.LOW,
                "description": "Code cleanup"
            }
        }
    
    async def process(self, req: BrainRequest) -> dict:
        """Main agent loop for PR review"""
        pr_data = req.payload
        diff = pr_data.get("diff", "")
        
        # Step 1: Extract relevant context from codebase
        related_code = await self._fetch_related_code(
            repo_full_name=req.repo_full_name,
            diff=diff
        )
        
        # Step 2: Analyze diff for patterns
        analysis = await self._analyze_diff(diff, related_code)
        
        # Step 3: Determine tags and priority
        tags = await self._determine_tags(diff, analysis)
        
        # Step 4: Generate review recommendation
        recommendation = await self._generate_recommendation(
            diff=diff,
            analysis=analysis,
            tags=tags,
            related_code=related_code
        )
        
        return {
            "tags": tags["tags"],
            "priority": tags["priority"],
            "needs_human_review": recommendation["needs_review"],
            "reason": recommendation["reason"],
            "checklist": recommendation["checklist"],
            "risk_areas": analysis.get("risk_areas", [])
        }
    
    async def _fetch_related_code(self, repo_full_name: str, diff: str) -> List[dict]:
        """Fetch related code context from PR diff"""
        files_changed = self._extract_files_from_diff(diff)
        
        diff_embedding = embed_text(diff[:2000])
        
        matches = retrieve_repo_embeddings(
            repo_full_name=repo_full_name,
            query_embedding=diff_embedding,
            limit=8,
            file_pattern="|".join(files_changed) if files_changed else None
        )
        
        return matches
    
    def _extract_files_from_diff(self, diff: str) -> List[str]:
        """Extract filenames from unified diff format"""
        files = re.findall(r'^diff --git a/(.+?) b/', diff, re.MULTILINE)
        return list(set(files))
    
    async def _analyze_diff(self, diff: str, related_code: List[dict]) -> dict:
        """Deep analysis of diff for risks and patterns"""
        
        additions = len([l for l in diff.split('\n') if l.startswith('+')])
        deletions = len([l for l in diff.split('\n') if l.startswith('-')])
        
        risk_indicators = {
            "complex_logic": self._detect_complex_logic(diff),
            "deprecated_usage": self._detect_deprecated(diff),
            "error_handling": self._detect_error_handling(diff),
            "side_effects": self._detect_side_effects(diff),
        }
        
        prompt = f"""Analyze this PR diff for potential issues:

DIFF (first 3000 chars):
{diff[:3000]}

RELATED_CODE:
{chr(10).join([f"{c['path']}: {c['content'][:300]}" for c in related_code[:3]])}

Identify:
1. Potential bugs or logic errors
2. Performance concerns
3. Security issues
4. Testing gaps
5. Breaking changes

Return JSON:
{{
  "bugs": ["..."],
  "performance_concerns": ["..."],
  "security_risks": ["..."],
  "testing_gaps": ["..."],
  "breaking_changes": ["..."]
}}"""
        
        response = self.llm.generate(prompt)
        
        try:
            analysis = json.loads(response)
        except:
            analysis = {
                "bugs": [],
                "performance_concerns": [],
                "security_risks": [],
                "testing_gaps": [],
                "breaking_changes": []
            }
        
        return {
            "diff_size": {"additions": additions, "deletions": deletions},
            "risk_indicators": risk_indicators,
            "analysis": analysis,
            "risk_areas": self._identify_risk_areas(analysis)
        }
    
    def _detect_complex_logic(self, diff: str) -> bool:
        """Detect complex control flow"""
        patterns = [
            r'(?:if|for|while).*(?:if|for|while)',
            r'lambda.*lambda',
            r'try.*except.*try.*except'
        ]
        return any(re.search(p, diff) for p in patterns)
    
    def _detect_deprecated(self, diff: str) -> bool:
        """Detect use of deprecated APIs"""
        deprecated_patterns = ['deprecated', 'todo', 'fixme', 'hack']
        return any(p in diff.lower() for p in deprecated_patterns)
    
    def _detect_error_handling(self, diff: str) -> bool:
        """Check if error handling is present"""
        return 'except' in diff or 'try' in diff or 'error' in diff
    
    def _detect_side_effects(self, diff: str) -> bool:
        """Detect operations with side effects"""
        patterns = [
            r'\.(delete|remove|pop)\(',
            r'\[.*\]\s*=',
            r'\.write\(',
            r'\.update\(',
        ]
        return any(re.search(p, diff) for p in patterns)
    
    def _identify_risk_areas(self, analysis: dict) -> List[dict]:
        """Compile risk areas from analysis"""
        risks = []
        
        if analysis.get("security_risks"):
            risks.append({
                "area": "security",
                "items": analysis["security_risks"],
                "severity": "critical"
            })
        
        if analysis.get("bugs"):
            risks.append({
                "area": "bugs",
                "items": analysis["bugs"],
                "severity": "high"
            })
        
        if analysis.get("performance_concerns"):
            risks.append({
                "area": "performance",
                "items": analysis["performance_concerns"],
                "severity": "medium"
            })
        
        if analysis.get("testing_gaps"):
            risks.append({
                "area": "testing",
                "items": analysis["testing_gaps"],
                "severity": "medium"
            })
        
        return risks
    
    async def _determine_tags(self, diff: str, analysis: dict) -> dict:
        """Determine tags and priority for PR"""
        tags = []
        priority = ReviewPriority.LOW
        
        diff_lower = diff.lower()
        
        for category, config in self.review_categories.items():
            if any(kw in diff_lower for kw in config["keywords"]):
                tags.append(category)
                if config["priority"].value > priority.value:
                    priority = config["priority"]
        
        if analysis["analysis"].get("security_risks"):
            priority = ReviewPriority.CRITICAL
            if "security" not in tags:
                tags.append("security")
        
        if analysis["analysis"].get("breaking_changes"):
            priority = ReviewPriority.HIGH
            if "breaking_change" not in tags:
                tags.append("breaking_change")
        
        if analysis["diff_size"]["additions"] > 500:
            priority = ReviewPriority.HIGH
            tags.append("large_change")
        
        return {
            "tags": list(set(tags)),
            "priority": priority.value
        }
    
    async def _generate_recommendation(
        self,
        diff: str,
        analysis: dict,
        tags: dict,
        related_code: List[dict]
    ) -> dict:
        """Generate human review recommendation"""
        
        needs_review = tags["priority"] in [
            ReviewPriority.CRITICAL.value,
            ReviewPriority.HIGH.value
        ]
        
        checklist = self._build_checklist(tags, analysis)
        
        prompt = f"""Given this PR review, provide a concise reason why human review is {'NEEDED' if needs_review else 'OPTIONAL'}.

Tags: {tags['tags']}
Priority: {tags['priority']}

Return JSON:
{{
  "reason": "Short reason (1-2 sentences)",
  "suggestion": "What reviewer should focus on"
}}"""
        
        response = self.llm.generate(prompt)
        
        try:
            reason_data = json.loads(response)
        except:
            reason_data = {
                "reason": f"PR has {', '.join(tags['tags'])} implications",
                "suggestion": "Review for potential issues"
            }
        
        return {
            "needs_review": needs_review,
            "reason": reason_data.get("reason", ""),
            "suggestion": reason_data.get("suggestion", ""),
            "checklist": checklist
        }
    
    def _build_checklist(self, tags: dict, analysis: dict) -> List[str]:
        """Build review checklist based on tags"""
        checklist = []
        
        if "security" in tags["tags"]:
            checklist.extend([
                "[ ] Check for SQL injection/XSS vulnerabilities",
                "[ ] Verify authentication/authorization logic",
                "[ ] Review secret/credential handling"
            ])
        
        if "performance" in tags["tags"]:
            checklist.extend([
                "[ ] Check query complexity and indexing",
                "[ ] Review algorithm complexity",
                "[ ] Look for memory leaks"
            ])
        
        if "breaking_change" in tags["tags"]:
            checklist.extend([
                "[ ] Verify version bump",
                "[ ] Check migration guides",
                "[ ] Review deprecation timeline"
            ])
        
        if "testing" in tags["tags"]:
            checklist.extend([
                "[ ] Verify test coverage increase",
                "[ ] Check edge cases are tested",
                "[ ] Review test quality"
            ])
        
        if "database" in tags["tags"]:
            checklist.extend([
                "[ ] Review migration safety",
                "[ ] Check rollback strategy",
                "[ ] Verify schema compatibility"
            ])
        
        return checklist