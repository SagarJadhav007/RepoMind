import json
from app.brain.router import route_task
from app.brain.llm.gemini import GeminiLLM

llm = GeminiLLM()

async def run_brain(req):
    payload = await route_task(req)

    prompt = f"""
{payload['instruction']}

Repository context:
{payload['context']}

Respond ONLY in this JSON format:
{{
  "answer": "Markdown explanation",
  "confidence": "high | medium | low",
  "sources": [
    {{
      "file": "filename",
      "lines": "start–end",
      "snippet": "short code excerpt"
    }}
  ]
}}
"""

    raw = llm.generate(prompt)

    try:
        return json.loads(raw)
    except Exception:
        return {
            "answer": raw,
            "confidence": "low",
            "sources": [],
        }
