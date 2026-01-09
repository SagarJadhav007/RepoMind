import json
from app.brain.router import route_task
from app.brain.llm.gemini import GeminiLLM

llm = GeminiLLM()


def run_brain(req):
    payload = route_task(req)

    prompt = f"""
{payload['instruction']}

{payload['context']}

Return valid JSON only in this format:
{{
  "answer": "..."
}}
"""

    raw = llm.generate(prompt)

    try:
        return json.loads(raw)
    except Exception:
        return {"answer": raw}
