import json
from app.brain.router import route_task
from app.brain.llm.gemini import GeminiLLM

llm = GeminiLLM()

async def run_brain(req):
    payload = await route_task(req)

    prompt = f"""
{payload['instruction']}

Context:
{payload['context']}

Rules:
- Be concise
- Use bullet points where helpful
- Cite file names when relevant

Return valid JSON ONLY in this format:
{{
  "answer": "clear explanation",
  "sources": ["file1.js", "file2.html"]
}}
"""

    raw = llm.generate(prompt)

    try:
        parsed = json.loads(raw)
        return {
            "answer": parsed.get("answer", ""),
            "sources": parsed.get("sources", payload.get("sources", [])),
        }
    except Exception:
        return {
            "answer": raw,
            "sources": payload.get("sources", []),
        }
