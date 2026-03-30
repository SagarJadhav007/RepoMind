from app.brain.agents.query_agent import QueryAnsweringAgent
from app.brain.agents.pr_review_agent import PRReviewAgent
from app.brain.schema import BrainRequest
from app.brain.task import TaskType

class AgentRouter:
    """Routes requests to appropriate agent"""
    
    def __init__(self):
        self.query_agent = QueryAnsweringAgent()
        self.pr_review_agent = PRReviewAgent()
    
    async def route(self, req: BrainRequest):
        """Route to appropriate agent based on task type"""
        
        if req.task_type == TaskType.CHAT:
            return await self.query_agent.process(req)
        
        elif req.task_type == TaskType.PR_REVIEW:
            return await self.pr_review_agent.process(req)
        
        else:
            raise ValueError(f"Unknown task type: {req.task_type}")